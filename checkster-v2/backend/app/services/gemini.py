"""
Checkster – Gemini provider / service layer (Google Gen AI SDK, `google-genai`).

* Model is chosen ONLY through env vars (GEMINI_MODEL, GEMINI_FALLBACK_MODEL).
* API key is read from env and never logged or returned.
* Async calls with a hard timeout, exponential-backoff retries on transient
  errors (429 / 5xx / timeouts), automatic fallback model, and typed errors.
* Every structured response is re-validated with Pydantic.
* Gemini never does quote maths — see services/audit.py.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import random
from pathlib import Path
from typing import Any, TypeVar

from dotenv import load_dotenv
from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from pydantic import BaseModel, ValidationError

from app.schemas import (
    AuditExplanation,
    ExtractedQuote,
    FollowupAnswer,
    InspectionResult,
    RefinedDiagnosis,
)

load_dotenv(Path(__file__).resolve().parents[2] / ".env", override=True)
load_dotenv(override=True)
logger = logging.getLogger("checkster.gemini")
T = TypeVar("T", bound=BaseModel)


def _normalise_model(name: str) -> str:
    name = (name or "").strip().removeprefix("models/")
    if name and not name.startswith(("gemini", "gemma")):
        name = f"gemini-{name}"  # allow "3.8-flash" shorthand
    return name


# ---------------------------------------------------------------------------
# Errors (mapped to HTTP codes in main.py)
# ---------------------------------------------------------------------------
class AIError(Exception):
    status_code = 502
    public_message = "The AI service returned an error."

    def __init__(self, message: str | None = None):
        super().__init__(message or self.public_message)
        self.message = message or self.public_message


class AINotConfigured(AIError):
    status_code = 503
    public_message = "AI is not configured on the server (GEMINI_API_KEY missing)."


class AIRateLimited(AIError):
    status_code = 429
    public_message = "The AI service is busy (rate limit). Please wait a minute and try again."


class AITimeout(AIError):
    status_code = 504
    public_message = "The AI took too long to respond. Please try again."


class AIBadResponse(AIError):
    status_code = 502
    public_message = "The AI returned an answer we could not validate. Please try again."


class AIBlocked(AIError):
    status_code = 422
    public_message = "The AI declined to process this content."


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------
SYSTEM_INSPECTOR = """You are Checkster, an independent home-inspection assistant for homeowners in Pakistan.
You give a careful PRELIMINARY opinion from photos — never a certified inspection.
Rules:
- Describe only what is actually visible. Separate visible evidence from suspected causes.
- Never present a visual guess as a confirmed diagnosis. Calibrate confidence honestly.
- Say clearly what a photo cannot show.
- Never recommend only painting over moisture; the source must be addressed first.
- Electrical hazards (water near sockets, scorch marks, exposed wires): safety-first, tell the user to switch off the circuit and call a qualified electrician. Never give DIY electrical instructions.
- Structural concerns (wide/diagonal/growing cracks): recommend a physical professional inspection.
- Use local terms where helpful (seelan, shora, DPC, mistri). Urdu text must be in Urdu (Nastaliq) script.
- If the image is not a home problem or is unusable, set image_usable=false and explain in summary."""

SYSTEM_QUOTE = """You read contractor quotations (takhmeena / تخمینہ) from Pakistan in English, Urdu or Roman Urdu.
Copy values exactly as written. NEVER invent or estimate missing numbers — use null and mark the line unclear.
Convert Urdu/Eastern-Arabic numerals (۰۱۲۳۴۵۶۷۸۹) to normal digits. Amounts are in PKR."""


class GeminiService:
    def __init__(self) -> None:
        self._env_path = Path(__file__).resolve().parents[2] / ".env"
        self._env_mtime: float = 0.0
        self.api_key: str = ""
        self.model: str = "gemini-3.8-flash"
        self.fallback_models: list[str] = []
        self.fallback_model: str = ""
        self.last_used_model: str = self.model
        self.timeout_s = float(os.getenv("GEMINI_TIMEOUT", "35"))
        self.max_retries = max(1, int(os.getenv("GEMINI_MAX_RETRIES", "2")))
        self._client: genai.Client | None = None
        self._refresh_env_if_changed(force=True)

    def _refresh_env_if_changed(self, force: bool = False) -> None:
        try:
            mtime = self._env_path.stat().st_mtime
        except OSError:
            mtime = 0.0
        if not force and mtime == self._env_mtime:
            return
        if mtime:
            load_dotenv(self._env_path, override=True)
        new_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model = _normalise_model(os.getenv("GEMINI_MODEL", "gemini-3.8-flash"))
        raw_fallbacks = os.getenv(
            "GEMINI_FALLBACK_MODEL",
            "gemini-3.5-flash-lite,gemini-3.5-flash,gemini-3.7-flash,gemini-3.1-flash-lite",
        )
        self.fallback_models = [
            _normalise_model(m) for m in raw_fallbacks.split(",") if _normalise_model(m)
        ]
        self.fallback_model = self.fallback_models[0] if self.fallback_models else ""
        self.timeout_s = float(os.getenv("GEMINI_TIMEOUT", "35"))
        self.max_retries = max(1, int(os.getenv("GEMINI_MAX_RETRIES", "2")))
        if new_key != self.api_key:
            self.api_key = new_key
            self._client = None
        self._env_mtime = mtime

    # ------------------------------------------------------------------
    @property
    def configured(self) -> bool:
        self._refresh_env_if_changed()
        return bool(self.api_key)

    def _get_client(self) -> genai.Client:
        self._refresh_env_if_changed()
        if not self.api_key:
            raise AINotConfigured()
        if self._client is None:
            http_kwargs: dict[str, Any] = {"timeout": int(self.timeout_s * 1000)}
            if hasattr(types, "HttpRetryOptions"):
                http_kwargs["retry_options"] = types.HttpRetryOptions(attempts=1)
            self._client = genai.Client(
                api_key=self.api_key,
                http_options=types.HttpOptions(**http_kwargs),
            )
        return self._client

    @staticmethod
    def _is_transient(exc: Exception) -> bool:
        if isinstance(exc, (asyncio.TimeoutError, TimeoutError)):
            return True
        code = getattr(exc, "code", None)
        return code in (408, 429, 500, 502, 503, 504)

    async def _call(self, model: str, contents: list[Any], config: types.GenerateContentConfig) -> str:
        client = self._get_client()
        resp = await asyncio.wait_for(
            client.aio.models.generate_content(model=model, contents=contents, config=config),
            timeout=self.timeout_s + 5,
        )
        if resp.prompt_feedback and getattr(resp.prompt_feedback, "block_reason", None):
            raise AIBlocked(f"Blocked by safety filter: {resp.prompt_feedback.block_reason}")
        text = resp.text or ""
        if not text.strip():
            raise AIBadResponse("Empty response from AI.")
        return text

    async def _generate(
        self,
        contents: list[Any],
        *,
        system: str,
        schema: type[BaseModel] | None,
        temperature: float,
    ) -> str:
        self._refresh_env_if_changed()
        cfg: dict[str, Any] = {"temperature": temperature, "system_instruction": system}
        if schema is not None:
            cfg["response_mime_type"] = "application/json"
            cfg["response_schema"] = schema
        config = types.GenerateContentConfig(**cfg)

        models: list[str] = []
        for m in [self.model, *self.fallback_models]:
            if m and m not in models:
                models.append(m)

        last_exc: Exception | None = None
        dead_models: set[str] = set()
        for attempt in range(1, self.max_retries + 1):
            for model in models:
                if model in dead_models:
                    continue
                try:
                    text = await self._call(model, contents, config)
                    self.last_used_model = model
                    logger.info("gemini ok model=%s attempt=%d", model, attempt)
                    return text
                except AIError:
                    raise
                except Exception as exc:  # noqa: BLE001
                    last_exc = exc
                    code = getattr(exc, "code", None)
                    logger.warning(
                        "gemini error model=%s attempt=%d code=%s type=%s",
                        model, attempt, code, type(exc).__name__,
                    )
                    if code == 404:
                        dead_models.add(model)
                        continue
                    if code in (401, 403):
                        raise AIError(f"AI key rejected ({code}). Check GEMINI_API_KEY in backend/.env.") from exc
                    if code == 400:
                        dead_models.add(model)
                        continue
                    # For 429 / 503 / 504 / timeouts, immediately try the next model in the chain first!
                    continue
            if attempt < self.max_retries and len(dead_models) < len(models):
                await asyncio.sleep(min(6, 1.5 * attempt) + random.random())
        if last_exc is not None:
            if isinstance(last_exc, (asyncio.TimeoutError, TimeoutError)):
                raise AITimeout() from last_exc
            if getattr(last_exc, "code", None) == 429:
                raise AIRateLimited() from last_exc
            if isinstance(last_exc, genai_errors.APIError):
                raise AIError(f"AI service error ({last_exc.code}).") from last_exc
        raise AIError() from last_exc

    async def _structured(self, schema: type[T], contents: list[Any], *, system: str, temperature: float) -> T:
        raw = await self._generate(contents, system=system, schema=schema, temperature=temperature)
        try:
            return schema.model_validate(json.loads(raw))
        except (json.JSONDecodeError, ValidationError) as exc:
            logger.error("schema validation failed for %s: %s", schema.__name__, str(exc)[:300])
            raise AIBadResponse() from exc

    @staticmethod
    def _lang_note(language: str) -> str:
        return {
            "ur": "The homeowner prefers Urdu. Write free-text fields (steps, warnings, limitations) in Urdu script; keep *_en fields in English.",
            "roman_ur": "The homeowner prefers Roman Urdu. Write free-text fields in simple Roman Urdu; *_ur fields stay in Urdu script.",
        }.get(language, "Write free-text fields in simple English; *_ur fields in Urdu script.")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    async def inspect_images(
        self,
        images: list[tuple[bytes, str]],
        *,
        category_hint: str = "",
        description: str = "",
        room: str = "",
        city: str = "",
        language: str = "en",
    ) -> InspectionResult:
        """Visual inspection. Image bytes go straight from our server to Gemini (never to disk)."""
        prompt = f"""Inspect the attached photo(s) of a home problem.
Homeowner-selected category: {category_hint or 'not specified'}
Room/area: {room or 'not specified'}   City: {city or 'not specified'}
Homeowner description (may be English, Urdu or Roman Urdu): \"\"\"{description[:1500] or 'none'}\"\"\"

Return 2-5 observations, 1-4 possible causes (probabilities need not sum to 1), and 2-4 follow-up
questions whose answers would most change the diagnosis (e.g. bathroom behind wall, worse after rain,
spreading, active dripping, how long). {self._lang_note(language)}"""
        parts: list[Any] = [types.Part.from_bytes(data=b, mime_type=m) for b, m in images]
        parts.append(prompt)
        return await self._structured(InspectionResult, parts, system=SYSTEM_INSPECTOR, temperature=0.2)

    async def refine_diagnosis(
        self,
        initial_inspection: dict,
        followup_answers: dict[str, str],
        *,
        language: str = "en",
    ) -> RefinedDiagnosis:
        """Coordinator + specialist reasoning in ONE call (no fake chat, no per-specialist calls)."""
        prompt = f"""You are the coordinator. Using ONLY the initial inspection and the homeowner's answers,
select the relevant specialists (plumbing, masonry, waterproofing, general, electrical — only those relevant),
give each a short grounded assessment, resolve disagreements, and produce one final diagnosis.

Initial inspection (from photo):
{json.dumps(initial_inspection, ensure_ascii=False)[:6000]}

Homeowner answers (question id -> answer):
{json.dumps(followup_answers, ensure_ascii=False)}

The repair_plan must be in correct order (fix the source -> let it dry -> plaster -> paint).
Do not invent new visual observations. {self._lang_note(language)}"""
        return await self._structured(RefinedDiagnosis, [prompt], system=SYSTEM_INSPECTOR, temperature=0.2)

    async def extract_quote_from_image(self, image_bytes: bytes, mime_type: str) -> ExtractedQuote:
        prompt = """Extract the quotation from this document. Put everything you can read in raw_text.
Set needs_user_review=true if any amount, quantity or line is unclear, and explain in review_notes."""
        return await self._structured(
            ExtractedQuote,
            [types.Part.from_bytes(data=image_bytes, mime_type=mime_type), prompt],
            system=SYSTEM_QUOTE,
            temperature=0.0,
        )

    async def extract_quote_from_text(self, text: str) -> ExtractedQuote:
        prompt = f"""This text was extracted (OCR / PDF text layer) from a contractor quotation:
\"\"\"{text[:12000]}\"\"\"
Structure it. Set needs_user_review=true if anything is ambiguous."""
        result = await self._structured(ExtractedQuote, [prompt], system=SYSTEM_QUOTE, temperature=0.0)
        if not result.raw_text:
            result.raw_text = text[:4000]
        return result

    async def explain_audit_findings(
        self,
        findings: list[dict],
        quote_items: list[dict],
        diagnosis: dict | None = None,
    ) -> AuditExplanation:
        prompt = f"""Explain these quote-audit findings to a homeowner. The findings and all numbers were computed
by deterministic code — do NOT recompute, change or add numbers, and do not add new findings.
Quote items: {json.dumps(quote_items, ensure_ascii=False)[:5000]}
Findings: {json.dumps(findings, ensure_ascii=False)[:6000]}
Inspection diagnosis (may be empty): {json.dumps(diagnosis or {}, ensure_ascii=False)[:3000]}
Give one explanation per finding id (English, Urdu script, Roman Urdu), plus 3-5 polite questions.
Be non-accusatory: never call the contractor dishonest."""
        return await self._structured(AuditExplanation, [prompt], system=SYSTEM_QUOTE, temperature=0.3)

    async def answer_followup(self, question: str, context: dict, *, language: str = "en") -> FollowupAnswer:
        prompt = f"""Inspection context: {json.dumps(context, ensure_ascii=False)[:6000]}
Homeowner question: \"\"\"{question[:1000]}\"\"\"
Answer in 2-4 sentences (English and Urdu script). Do not claim certainty that needs a site visit."""
        return await self._structured(FollowupAnswer, [prompt], system=SYSTEM_INSPECTOR, temperature=0.4)

    def health(self) -> dict:
        self._refresh_env_if_changed()
        return {
            "ai_provider": "google-gemini",
            "model": self.model,
            "fallback_models": self.fallback_models,
            "fallback_model": self.fallback_model or None,
            "api_key_configured": self.configured,
        }


gemini_service = GeminiService()
