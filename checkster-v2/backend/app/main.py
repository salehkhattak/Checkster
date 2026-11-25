"""
Checkster FastAPI Backend — Complete API Server.

Includes:
- Health & configuration status (never exposes API keys)
- User authentication & profile management (Homeowner, Contractor, Administrator)
- Private file storage with HMAC-SHA256 signed URLs
- Real Gemini vision home inspection + specialist coordinator refinement
- Persistent inspections, evidence, and recommendations
- Quotation upload, PDF/Image OCR extraction, deterministic Python audit, and AI explanation
- Pakistan-specific pricing intelligence (PBS, Punjab Finance Dept, KP notes, market & sample distinctions)
- Local contractor discovery (Google Maps Platform Places API + Checkster Contractor Directory)
- Contractor onboarding, verification workflow, reviews, saved contractors, and repair requests
"""
from __future__ import annotations

import json
import logging
import os
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=True)
load_dotenv(override=True)

from app.database import db_cursor, init_db, new_id, now_iso, parse_json_field, row_to_dict  # noqa: E402
from app.services import maps, pricing  # noqa: E402
from app.services.audit import audit_quote, compute_line_total, findings_to_dict  # noqa: E402
from app.services.auth import (  # noqa: E402
    authenticate_user,
    create_access_token,
    create_password_reset,
    get_current_user,
    get_optional_user,
    register_user,
    require_admin,
    reset_password_with_token,
    sanitize_user,
)
from app.services.gemini import AIError, gemini_service  # noqa: E402
from app.services.ocr import UploadError, check_size, extract_text_from_pdf, is_pdf, sanitize_image  # noqa: E402
from app.services.storage import (  # noqa: E402
    delete_private_file,
    sign_file_url,
    store_private_file,
    verify_and_read_file,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("checkster.api")

CORS_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:3001,https://hackathon-giki-2.vercel.app",
    ).split(",")
    if o.strip()
]
RATE_LIMIT = int(os.getenv("RATE_LIMIT_PER_MINUTE", "30"))
MAX_IMAGES = 4
LANGS = {"en", "ur", "roman_ur"}


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    logger.info("Checkster API started — model=%s", gemini_service.model)
    yield


app = FastAPI(
    title="Checkster API",
    version="1.0.0",
    description="AI-assisted home inspection & contractor quote auditing platform (Pakistan)",
    lifespan=lifespan,
)

# Initialize database immediately so module-level usage / tests always have tables ready
init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$|^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Per-IP rate limiting for AI endpoints
# ---------------------------------------------------------------------------
_hits: dict[str, deque] = defaultdict(deque)


@app.middleware("http")
async def rate_limit(request: Request, call_next):
    path = request.url.path
    if request.method == "POST" and path.startswith(("/api/inspect", "/api/quote/extract", "/api/quote/explain")):
        ip = (
            request.headers.get("x-forwarded-for", "").split(",")[0].strip()
            or (request.client.host if request.client else "?")
        )
        now, q = time.time(), _hits[ip]
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) >= RATE_LIMIT:
            return JSONResponse(
                {"detail": "Too many AI requests. Please wait a minute.", "code": "rate_limited"},
                status_code=429,
            )
        q.append(now)
    return await call_next(request)


@app.exception_handler(AIError)
async def ai_error_handler(_: Request, exc: AIError):
    return JSONResponse({"detail": exc.message, "code": type(exc).__name__}, status_code=exc.status_code)


@app.exception_handler(UploadError)
async def upload_error_handler(_: Request, exc: UploadError):
    return JSONResponse({"detail": str(exc), "code": "invalid_upload"}, status_code=400)


def _lang(v: str) -> str:
    return v if v in LANGS else "en"


def _require_consent(consent: bool) -> None:
    if not consent:
        raise HTTPException(400, "Consent is required before sending files to the AI provider (Google Gemini).")


def _format_inspection(row: dict[str, Any]) -> dict[str, Any]:
    raw_files = parse_json_field(row.get("image_urls"), [])
    signed_urls = [sign_file_url(fid) if not str(fid).startswith("http") else fid for fid in raw_files]
    return {
        "id": row["id"],
        "user_id": row.get("user_id"),
        "property_location": row.get("property_location", ""),
        "city": row.get("city", "peshawar"),
        "neighbourhood": row.get("neighbourhood", ""),
        "room": row.get("room", "bedroom"),
        "area_sqft": row.get("area_sqft", 40),
        "issue_category": row["issue_category"],
        "description": row.get("description", ""),
        "image_files": raw_files,
        "image_urls": signed_urls,
        "initial_analysis": parse_json_field(row.get("initial_analysis_json"), {}),
        "followup_answers": parse_json_field(row.get("followup_answers_json"), {}),
        "diagnosis_data": parse_json_field(row.get("diagnosis_json"), {}),
        "estimate_data": parse_json_field(row.get("estimate_json"), {}),
        "diagnosis": row.get("diagnosis", ""),
        "severity": row.get("severity", "moderate"),
        "confidence": row.get("confidence", 0.0),
        "status": row["status"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=180)
    password: str = Field(min_length=6, max_length=128)
    phone: str = ""
    city: str = "peshawar"
    neighbourhood: str = ""
    preferred_language: str = "en"
    role: str = "homeowner"


class LoginRequest(BaseModel):
    email: str
    password: str


class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    phone: str | None = None
    city: str | None = None
    neighbourhood: str | None = None
    preferred_language: str | None = None


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=6, max_length=128)


class RefineRequest(BaseModel):
    initial_inspection: dict
    followup_answers: dict[str, str] = Field(max_length=12)
    language: str = "en"
    inspection_id: str | None = None
    area_sqft: float = 40
    city: str = "peshawar"


class AskRequest(BaseModel):
    question: str = Field(min_length=2, max_length=1000)
    context: dict
    language: str = "en"


class EstimateRequest(BaseModel):
    repair_plan: list[dict] = Field(default_factory=list, max_length=20)
    area_sqft: float = Field(default=40, ge=1, le=10000)
    city: str = ""


class AuditRequest(BaseModel):
    items: list[dict] = Field(max_length=200)
    stated_total: float | None = Field(default=None, ge=0)
    diagnosis: dict | None = None
    estimate_low: float | None = None
    city: str = ""
    quotation_id: str | None = None
    inspection_id: str | None = None
    contractor_name: str = ""


class ExplainRequest(BaseModel):
    findings: list[dict] = Field(max_length=50)
    quote_items: list[dict] = Field(max_length=200)
    diagnosis: dict | None = None
    quotation_id: str | None = None


class InspectionPatchRequest(BaseModel):
    status: str | None = None
    followup_answers: dict[str, str] | None = None
    diagnosis_data: dict | None = None
    estimate_data: dict | None = None


class ContractorOnboardRequest(BaseModel):
    business_name: str = Field(min_length=2, max_length=150)
    owner_name: str = ""
    phone: str = Field(min_length=7, max_length=30)
    email: str = ""
    service_categories: list[str] = Field(default_factory=list)
    experience_years: int = Field(default=1, ge=0, le=70)
    daily_rate: float = Field(default=2000, ge=500, le=100000)
    description: str = ""
    city: str = "peshawar"
    neighbourhood: str = ""
    working_areas: list[str] = Field(default_factory=list)
    address: str = ""
    latitude: float | None = None
    longitude: float | None = None
    is_available: bool = True


class ContractorReviewRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    review: str = Field(default="", max_length=1000)


class VerificationReviewRequest(BaseModel):
    verification_status: str = Field(description="under_review | verified | rejected")
    verification_notes: str = ""


class SavedContractorRequest(BaseModel):
    contractor_id: str | None = None
    google_place_id: str | None = None
    snapshot: dict = Field(default_factory=dict)


class RepairRequestCreate(BaseModel):
    inspection_id: str | None = None
    contractor_id: str | None = None
    trade: str = "plumber"
    title: str = Field(min_length=2, max_length=200)
    description: str = ""
    city: str = "peshawar"
    neighbourhood: str = ""
    offered_price: float = Field(ge=0)
    scheduled_date: str = ""


class RepairRequestUpdate(BaseModel):
    status: str = Field(description="accepted | countered | rejected | scheduled | completed | cancelled")
    counter_price: float | None = None
    scheduled_date: str | None = None


# ---------------------------------------------------------------------------
# Health & Root
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    return {"service": "Checkster API", "status": "running", "docs": "/docs"}


@app.get("/api/health")
async def health():
    """Health check — reports active Gemini model & configuration booleans without exposing keys."""
    return {
        "status": "ok",
        **gemini_service.health(),
        "maps_configured": bool(maps.GOOGLE_MAPS_API_KEY),
    }


# ---------------------------------------------------------------------------
# Private Signed Files
# ---------------------------------------------------------------------------
@app.get("/api/files/{file_id}")
async def serve_private_file(file_id: str, expires: int = Query(...), sig: str = Query(...)):
    data, mime = verify_and_read_file(file_id, expires, sig)
    return Response(content=data, media_type=mime, headers={"Cache-Control": "private, max-age=300"})


# ---------------------------------------------------------------------------
# Authentication & User Account
# ---------------------------------------------------------------------------
@app.post("/api/auth/register")
async def api_register(body: RegisterRequest):
    user = register_user(
        name=body.name,
        email=body.email,
        password=body.password,
        phone=body.phone,
        city=body.city,
        neighbourhood=body.neighbourhood,
        preferred_language=body.preferred_language,
        role=body.role,
    )
    token = create_access_token(user["id"], user["role"], user["email"])
    return {"user": user, "access_token": token, "token_type": "bearer"}


@app.post("/api/auth/login")
async def api_login(body: LoginRequest):
    user, token = authenticate_user(body.email, body.password)
    return {"user": user, "access_token": token, "token_type": "bearer"}


@app.get("/api/auth/me")
async def api_me(user: dict[str, Any] = Depends(get_current_user)):
    return {"user": user}


@app.patch("/api/auth/profile")
async def api_update_profile(body: ProfileUpdateRequest, user: dict[str, Any] = Depends(get_current_user)):
    fields: list[str] = []
    values: list[Any] = []
    for k in ("name", "phone", "city", "neighbourhood", "preferred_language"):
        v = getattr(body, k)
        if v is not None:
            fields.append(f"{k} = ?")
            values.append(v.strip())
    if fields:
        values.append(user["id"])
        with db_cursor(commit=True) as cur:
            cur.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = ?", tuple(values))
            cur.execute("SELECT * FROM users WHERE id = ?", (user["id"],))
            updated = row_to_dict(cur.fetchone())
            return {"user": sanitize_user(updated) if updated else user}
    return {"user": user}


@app.post("/api/auth/password-reset/request")
async def api_password_reset_request(body: PasswordResetRequest):
    token = create_password_reset(body.email)
    return {
        "message": "If an account exists for that email, a password reset token has been generated.",
        "reset_token_preview": token,  # Returned in MVP so local dev without SMTP can test reset
    }


@app.post("/api/auth/password-reset/confirm")
async def api_password_reset_confirm(body: PasswordResetConfirm):
    reset_password_with_token(body.token, body.new_password)
    return {"status": "ok", "message": "Password updated. You may now log in."}


@app.delete("/api/auth/account")
async def api_delete_account(user: dict[str, Any] = Depends(get_current_user)):
    with db_cursor(commit=True) as cur:
        cur.execute("SELECT image_urls FROM inspections WHERE user_id = ?", (user["id"],))
        for r in cur.fetchall():
            for fid in parse_json_field(r["image_urls"], []):
                delete_private_file(str(fid))
        cur.execute("SELECT uploaded_file_url FROM quotations WHERE user_id = ?", (user["id"],))
        for r in cur.fetchall():
            if r["uploaded_file_url"]:
                delete_private_file(str(r["uploaded_file_url"]))
        cur.execute("DELETE FROM inspections WHERE user_id = ?", (user["id"],))
        cur.execute("DELETE FROM quotations WHERE user_id = ?", (user["id"],))
        cur.execute("DELETE FROM users WHERE id = ?", (user["id"],))
    return {"status": "deleted"}


# ---------------------------------------------------------------------------
# AI Inspection & Persistent Inspections
# ---------------------------------------------------------------------------
@app.post("/api/inspect")
async def inspect(
    images: list[UploadFile] = File(..., description="1-4 photos (JPG/PNG/WEBP)"),
    category: str = Form(""),
    description: str = Form("", max_length=2000),
    room: str = Form("bedroom"),
    city: str = Form("peshawar"),
    neighbourhood: str = Form(""),
    area_sqft: float = Form(40),
    language: str = Form("en"),
    consent: bool = Form(False),
    inspection_id: str = Form(""),
    user: dict[str, Any] | None = Depends(get_optional_user),
):
    _require_consent(consent)
    if not 1 <= len(images) <= MAX_IMAGES:
        raise HTTPException(400, f"Upload between 1 and {MAX_IMAGES} photos.")

    prepared: list[tuple[bytes, str]] = []
    stored_file_ids: list[str] = []
    for f in images:
        clean_bytes, mime = sanitize_image(await f.read(), max_side=1280)
        prepared.append((clean_bytes, mime))
        stored_file_ids.append(store_private_file(clean_bytes, mime, prefix="insp"))

    result = await gemini_service.inspect_images(
        prepared,
        category_hint=category,
        description=description,
        room=room,
        city=city,
        language=_lang(language),
    )
    dump = result.model_dump()

    insp_id = inspection_id.strip() or new_id("chk")
    ts = now_iso()
    top_conf = max((o.confidence for o in result.observations), default=0.7)

    with db_cursor(commit=True) as cur:
        cur.execute("SELECT id FROM inspections WHERE id = ?", (insp_id,))
        exists = cur.fetchone()
        if exists:
            cur.execute(
                """
                UPDATE inspections SET
                    issue_category = ?, description = ?, room = ?, city = ?, neighbourhood = ?,
                    area_sqft = ?, image_urls = ?, initial_analysis_json = ?, severity = ?,
                    confidence = ?, status = 'awaiting_answers', updated_at = ?
                WHERE id = ?
                """,
                (
                    result.issue_category, description, room, city, neighbourhood, area_sqft,
                    json.dumps(stored_file_ids), json.dumps(dump, ensure_ascii=False),
                    result.severity, top_conf, ts, insp_id,
                ),
            )
            cur.execute("DELETE FROM inspection_evidence WHERE inspection_id = ?", (insp_id,))
        else:
            cur.execute(
                """
                INSERT INTO inspections (
                    id, user_id, property_location, city, neighbourhood, room, area_sqft,
                    issue_category, description, image_urls, initial_analysis_json,
                    severity, confidence, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_answers', ?, ?)
                """,
                (
                    insp_id, user["id"] if user else None, f"{neighbourhood}, {city}".strip(", "),
                    city, neighbourhood, room, area_sqft, result.issue_category, description,
                    json.dumps(stored_file_ids), json.dumps(dump, ensure_ascii=False),
                    result.severity, top_conf, ts, ts,
                ),
            )
        for idx, obs in enumerate(result.observations):
            ref_file = stored_file_ids[min(idx, len(stored_file_ids) - 1)] if stored_file_ids else ""
            cur.execute(
                """
                INSERT INTO inspection_evidence (id, inspection_id, observation, image_reference, evidence_type, confidence)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (new_id("ev"), insp_id, f"{obs.observation} — {obs.evidence}", ref_file, obs.location_hint or "visual", obs.confidence),
            )

    return {
        "inspection_id": insp_id,
        "image_urls": [sign_file_url(fid) for fid in stored_file_ids],
        "model": gemini_service.last_used_model or gemini_service.model,
        "generated_at": int(time.time()),
        **dump,
    }


@app.post("/api/inspect/refine")
async def refine(
    body: RefineRequest,
    user: dict[str, Any] | None = Depends(get_optional_user),
):
    result = await gemini_service.refine_diagnosis(
        body.initial_inspection,
        body.followup_answers,
        language=_lang(body.language),
    )
    dump = result.model_dump()
    est = pricing.estimate_repair_cost(dump.get("repair_plan", []), body.area_sqft, body.city)

    if body.inspection_id:
        ts = now_iso()
        with db_cursor(commit=True) as cur:
            cur.execute(
                """
                UPDATE inspections SET
                    user_id = COALESCE(user_id, ?),
                    followup_answers_json = ?,
                    diagnosis_json = ?,
                    estimate_json = ?,
                    diagnosis = ?,
                    severity = ?,
                    confidence = ?,
                    status = 'diagnosis_ready',
                    updated_at = ?
                WHERE id = ?
                """,
                (
                    user["id"] if user else None,
                    json.dumps(body.followup_answers, ensure_ascii=False),
                    json.dumps(dump, ensure_ascii=False),
                    json.dumps(est, ensure_ascii=False),
                    result.final_cause,
                    result.severity,
                    result.confidence,
                    ts,
                    body.inspection_id,
                ),
            )
            cur.execute("DELETE FROM inspection_recommendations WHERE inspection_id = ?", (body.inspection_id,))
            for idx, step in enumerate(result.repair_plan, start=1):
                cur.execute(
                    """
                    INSERT INTO inspection_recommendations (
                        id, inspection_id, repair_action, trade, materials,
                        estimated_cost, safety_level, explanation, step_order
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        new_id("rec"),
                        body.inspection_id,
                        step.step,
                        step.trade,
                        json.dumps(step.materials, ensure_ascii=False),
                        round(step.estimated_days * 2000),
                        step.safety_level,
                        result.cause_explanation,
                        idx,
                    ),
                )

    return {**dump, "estimate": est}


@app.post("/api/inspect/ask")
async def ask(body: AskRequest):
    return (await gemini_service.answer_followup(body.question, body.context, language=_lang(body.language))).model_dump()


@app.get("/api/inspections")
async def list_inspections(user: dict[str, Any] = Depends(get_current_user)):
    with db_cursor(commit=False) as cur:
        cur.execute("SELECT * FROM inspections WHERE user_id = ? ORDER BY created_at DESC", (user["id"],))
        rows = [row_to_dict(r) for r in cur.fetchall()]
    return {"inspections": [_format_inspection(r) for r in rows if r]}


@app.get("/api/inspections/{inspection_id}")
async def get_inspection(inspection_id: str, user: dict[str, Any] | None = Depends(get_optional_user)):
    with db_cursor(commit=False) as cur:
        cur.execute("SELECT * FROM inspections WHERE id = ?", (inspection_id,))
        row = row_to_dict(cur.fetchone())
        if not row:
            raise HTTPException(404, "Inspection not found.")
        if row.get("user_id") and user and row["user_id"] != user["id"] and user.get("role") != "admin":
            raise HTTPException(403, "You do not have permission to view this private inspection.")

        cur.execute("SELECT * FROM inspection_evidence WHERE inspection_id = ?", (inspection_id,))
        evidence = [row_to_dict(r) for r in cur.fetchall()]

        cur.execute("SELECT * FROM inspection_recommendations WHERE inspection_id = ? ORDER BY step_order ASC", (inspection_id,))
        recommendations = [row_to_dict(r) for r in cur.fetchall()]

        cur.execute("SELECT * FROM quotations WHERE inspection_id = ? ORDER BY created_at DESC", (inspection_id,))
        quotes = [row_to_dict(r) for r in cur.fetchall()]
        formatted_quotes = []
        for q in quotes:
            if not q:
                continue
            cur.execute("SELECT * FROM quotation_line_items WHERE quotation_id = ?", (q["id"],))
            q_items = [row_to_dict(it) for it in cur.fetchall()]
            formatted_quotes.append({
                **q,
                "uploaded_file_signed_url": sign_file_url(q["uploaded_file_url"]) if q.get("uploaded_file_url") else "",
                "findings": parse_json_field(q.get("findings_json"), []),
                "ai_explanation": parse_json_field(q.get("ai_explanation_json"), {}),
                "line_items": q_items,
            })

    formatted = _format_inspection(row)
    formatted["evidence"] = evidence
    formatted["recommendations"] = recommendations
    formatted["quotations"] = formatted_quotes
    return formatted


@app.patch("/api/inspections/{inspection_id}")
async def patch_inspection(
    inspection_id: str,
    body: InspectionPatchRequest,
    user: dict[str, Any] | None = Depends(get_optional_user),
):
    with db_cursor(commit=True) as cur:
        cur.execute("SELECT * FROM inspections WHERE id = ?", (inspection_id,))
        row = row_to_dict(cur.fetchone())
        if not row:
            raise HTTPException(404, "Inspection not found.")
        if row.get("user_id") and user and row["user_id"] != user["id"] and user.get("role") != "admin":
            raise HTTPException(403, "Access denied.")

        updates = ["updated_at = ?"]
        vals: list[Any] = [now_iso()]
        if user and not row.get("user_id"):
            updates.append("user_id = ?")
            vals.append(user["id"])
        if body.status:
            updates.append("status = ?")
            vals.append(body.status)
        if body.followup_answers is not None:
            updates.append("followup_answers_json = ?")
            vals.append(json.dumps(body.followup_answers, ensure_ascii=False))
        if body.diagnosis_data is not None:
            updates.append("diagnosis_json = ?")
            vals.append(json.dumps(body.diagnosis_data, ensure_ascii=False))
        if body.estimate_data is not None:
            updates.append("estimate_json = ?")
            vals.append(json.dumps(body.estimate_data, ensure_ascii=False))
        vals.append(inspection_id)
        cur.execute(f"UPDATE inspections SET {', '.join(updates)} WHERE id = ?", tuple(vals))
        cur.execute("SELECT * FROM inspections WHERE id = ?", (inspection_id,))
        updated = row_to_dict(cur.fetchone())
    return _format_inspection(updated) if updated else {}


@app.delete("/api/inspections/{inspection_id}")
async def delete_inspection(inspection_id: str, user: dict[str, Any] = Depends(get_current_user)):
    with db_cursor(commit=True) as cur:
        cur.execute("SELECT * FROM inspections WHERE id = ?", (inspection_id,))
        row = row_to_dict(cur.fetchone())
        if not row:
            raise HTTPException(404, "Inspection not found.")
        if row.get("user_id") != user["id"] and user.get("role") != "admin":
            raise HTTPException(403, "You can only delete your own inspections.")
        for fid in parse_json_field(row.get("image_urls"), []):
            delete_private_file(str(fid))
        cur.execute("DELETE FROM inspections WHERE id = ?", (inspection_id,))
    return {"status": "deleted"}


# ---------------------------------------------------------------------------
# Pricing & Cost Estimation
# ---------------------------------------------------------------------------
@app.post("/api/estimate")
async def estimate(body: EstimateRequest):
    return pricing.estimate_repair_cost(body.repair_plan, body.area_sqft, body.city)


@app.get("/api/pricing/references")
async def price_references(category: str | None = None, location: str | None = None):
    return {"references": pricing.references(category, location)}


# ---------------------------------------------------------------------------
# Quotation Upload, OCR, Deterministic Audit & AI Explanation
# ---------------------------------------------------------------------------
@app.post("/api/quote/extract")
async def extract_quote(
    file: UploadFile = File(...),
    consent: bool = Form(False),
    inspection_id: str = Form(""),
    user: dict[str, Any] | None = Depends(get_optional_user),
):
    _require_consent(consent)
    data = await file.read()
    check_size(data)
    if is_pdf(data):
        stored_id = store_private_file(data, "application/pdf", prefix="quote")
        text = extract_text_from_pdf(data)
        if len(text) > 40:
            method = "pdf_text_layer+gemini_structuring"
            result = await gemini_service.extract_quote_from_text(text)
        else:
            method = "gemini_vision_pdf"
            result = await gemini_service.extract_quote_from_image(data, "application/pdf")
    else:
        img, mime = sanitize_image(data, max_side=2400)
        stored_id = store_private_file(img, mime, prefix="quote")
        method = "gemini_vision_image"
        result = await gemini_service.extract_quote_from_image(img, mime)

    payload = result.model_dump()
    payload["computed_line_total"] = compute_line_total(payload["line_items"])
    if any(i.get("total_price") is None or i.get("unclear") for i in payload["line_items"]):
        payload["needs_user_review"] = True
    payload["extraction_method"] = method

    quote_id = new_id("qt")
    with db_cursor(commit=True) as cur:
        cur.execute(
            """
            INSERT INTO quotations (
                id, user_id, inspection_id, contractor_name, quote_date,
                uploaded_file_url, extracted_text, quoted_total, audited_total,
                audit_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'extracted', ?)
            """,
            (
                quote_id,
                user["id"] if user else None,
                inspection_id.strip() or None,
                payload.get("contractor_name", ""),
                payload.get("date", ""),
                stored_id,
                payload.get("raw_text", ""),
                payload.get("stated_total"),
                payload["computed_line_total"],
                now_iso(),
            ),
        )
        for item in payload["line_items"]:
            cur.execute(
                """
                INSERT INTO quotation_line_items (
                    id, quotation_id, description, quantity, unit,
                    unit_price, total_price, normalized_category
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    new_id("qli"),
                    quote_id,
                    item.get("description", ""),
                    item.get("quantity"),
                    item.get("unit", ""),
                    item.get("unit_price"),
                    item.get("total_price"),
                    item.get("category", "other"),
                ),
            )
        if inspection_id.strip():
            cur.execute(
                "UPDATE inspections SET status = 'quote_uploaded', updated_at = ? WHERE id = ?",
                (now_iso(), inspection_id.strip()),
            )

    payload["quotation_id"] = quote_id
    payload["uploaded_file_signed_url"] = sign_file_url(stored_id)
    return payload


@app.post("/api/quote/audit")
async def audit(body: AuditRequest, user: dict[str, Any] | None = Depends(get_optional_user)):
    findings = audit_quote(body.items, body.stated_total, body.diagnosis, body.estimate_low, body.city)
    findings_dict = findings_to_dict(findings)
    computed = compute_line_total(body.items)

    quote_id = body.quotation_id or new_id("qt")
    with db_cursor(commit=True) as cur:
        cur.execute("SELECT id FROM quotations WHERE id = ?", (quote_id,))
        if cur.fetchone():
            cur.execute(
                """
                UPDATE quotations SET
                    user_id = COALESCE(user_id, ?),
                    inspection_id = COALESCE(inspection_id, ?),
                    contractor_name = CASE WHEN ? != '' THEN ? ELSE contractor_name END,
                    quoted_total = ?,
                    audited_total = ?,
                    audit_status = 'audited',
                    findings_json = ?
                WHERE id = ?
                """,
                (
                    user["id"] if user else None,
                    body.inspection_id,
                    body.contractor_name,
                    body.contractor_name,
                    body.stated_total,
                    computed,
                    json.dumps(findings_dict, ensure_ascii=False),
                    quote_id,
                ),
            )
            cur.execute("DELETE FROM quotation_line_items WHERE quotation_id = ?", (quote_id,))
        else:
            cur.execute(
                """
                INSERT INTO quotations (
                    id, user_id, inspection_id, contractor_name, quoted_total,
                    audited_total, audit_status, findings_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'audited', ?, ?)
                """,
                (
                    quote_id,
                    user["id"] if user else None,
                    body.inspection_id,
                    body.contractor_name,
                    body.stated_total,
                    computed,
                    json.dumps(findings_dict, ensure_ascii=False),
                    now_iso(),
                ),
            )
        for item in body.items:
            if not str(item.get("description", "")).strip():
                continue
            cur.execute(
                """
                INSERT INTO quotation_line_items (
                    id, quotation_id, description, quantity, unit,
                    unit_price, total_price, normalized_category
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    new_id("qli"),
                    quote_id,
                    item.get("description", ""),
                    item.get("quantity"),
                    item.get("unit", ""),
                    item.get("unit_price"),
                    item.get("total_price"),
                    item.get("category", "other"),
                ),
            )
        if body.inspection_id:
            cur.execute(
                "UPDATE inspections SET status = 'quote_audited', updated_at = ? WHERE id = ?",
                (now_iso(), body.inspection_id),
            )

    return {
        "quotation_id": quote_id,
        "findings": findings_dict,
        "total_issues": sum(1 for f in findings if f.severity != "info"),
        "computed_total": computed,
        "stated_total": body.stated_total,
    }


@app.post("/api/quote/explain")
async def explain(body: ExplainRequest):
    res = (await gemini_service.explain_audit_findings(body.findings, body.quote_items, body.diagnosis)).model_dump()
    if body.quotation_id:
        with db_cursor(commit=True) as cur:
            cur.execute(
                "UPDATE quotations SET ai_explanation_json = ? WHERE id = ?",
                (json.dumps(res, ensure_ascii=False), body.quotation_id),
            )
    return res


@app.get("/api/quotations")
async def list_quotations(user: dict[str, Any] = Depends(get_current_user)):
    with db_cursor(commit=False) as cur:
        cur.execute("SELECT * FROM quotations WHERE user_id = ? ORDER BY created_at DESC", (user["id"],))
        quotes = [row_to_dict(r) for r in cur.fetchall()]
        out = []
        for q in quotes:
            if not q:
                continue
            cur.execute("SELECT * FROM quotation_line_items WHERE quotation_id = ?", (q["id"],))
            items = [row_to_dict(i) for i in cur.fetchall()]
            out.append({
                **q,
                "findings": parse_json_field(q.get("findings_json"), []),
                "ai_explanation": parse_json_field(q.get("ai_explanation_json"), {}),
                "line_items": items,
            })
    return {"quotations": out}


# ---------------------------------------------------------------------------
# Contractor Discovery (Checkster DB + Official Google Maps Platform)
# ---------------------------------------------------------------------------
def _format_contractor(row: dict[str, Any], ratings_map: dict[str, tuple[float, int]] | None = None) -> dict[str, Any]:
    cid = row["id"]
    avg_rating, review_count = (ratings_map or {}).get(cid, (0.0, 0))
    ver_status = row.get("verification_status", "pending")
    listing_badge = (
        "checkster_verified"
        if ver_status == "verified"
        else "checkster_registered"
    )
    return {
        "id": cid,
        "user_id": row.get("user_id"),
        "business_name": row["business_name"],
        "owner_name": row.get("owner_name", ""),
        "phone": row["phone"],
        "email": row.get("email", ""),
        "service_categories": parse_json_field(row.get("service_categories"), []),
        "experience_years": row.get("experience_years", 1),
        "daily_rate": row.get("daily_rate", 2000),
        "description": row.get("description", ""),
        "city": row.get("city", "peshawar"),
        "neighbourhood": row.get("neighbourhood", ""),
        "working_areas": parse_json_field(row.get("working_areas"), []),
        "address": row.get("address", ""),
        "latitude": row.get("latitude"),
        "longitude": row.get("longitude"),
        "is_available": bool(row.get("is_available", 1)),
        "registration_status": row.get("registration_status", "checkster_registered"),
        "verification_status": ver_status,
        "listing_status": listing_badge,
        "is_external_listing": False,
        "rating": round(avg_rating, 1) if review_count else None,
        "review_count": review_count,
        "created_at": row["created_at"],
    }


@app.get("/api/contractors/discover")
async def discover_contractors(
    category: str = Query(default="plumber"),
    city: str = Query(default="peshawar"),
    neighbourhood: str = Query(default=""),
    lat: float | None = Query(default=None),
    lng: float | None = Query(default=None),
):
    """
    Returns both:
    1. Registered & Verified Checkster contractors from our database.
    2. Live external listings from Google Maps Platform Places API (when GOOGLE_MAPS_API_KEY is configured).
    Strictly distinguishes between:
    - google_maps_listed
    - checkster_registered
    - checkster_verified
    """
    with db_cursor(commit=False) as cur:
        cur.execute(
            "SELECT * FROM contractors WHERE lower(city) = lower(?) AND is_available = 1 ORDER BY created_at DESC",
            (city.strip() or "peshawar",),
        )
        raw_contractors = [row_to_dict(r) for r in cur.fetchall()]
        cur.execute(
            "SELECT contractor_id, AVG(rating) as avg_r, COUNT(*) as cnt FROM contractor_reviews GROUP BY contractor_id"
        )
        ratings_map = {r["contractor_id"]: (float(r["avg_r"]), int(r["cnt"])) for r in cur.fetchall()}

    checkster_list = []
    cat_lower = category.lower().strip()
    for r in raw_contractors:
        if not r:
            continue
        formatted = _format_contractor(r, ratings_map)
        cats = [c.lower() for c in formatted["service_categories"]]
        if not cat_lower or cat_lower in cats or "general" in cats:
            checkster_list.append(formatted)

    # Sort verified first, then registered
    checkster_list.sort(key=lambda c: (0 if c["listing_status"] == "checkster_verified" else 1))

    gmaps_res = await maps.search_google_places(
        category=category,
        city=city,
        neighbourhood=neighbourhood,
        latitude=lat,
        longitude=lng,
    )

    return {
        "checkster_contractors": checkster_list,
        "google_maps_listings": gmaps_res.get("places", []),
        "maps_configured": gmaps_res.get("maps_configured", False),
        "maps_setup_message": gmaps_res.get("setup_message"),
        "maps_error": gmaps_res.get("error"),
        "attribution": gmaps_res.get("attribution"),
    }


@app.post("/api/contractors")
async def register_contractor_profile(
    body: ContractorOnboardRequest,
    user: dict[str, Any] = Depends(get_current_user),
):
    with db_cursor(commit=True) as cur:
        cur.execute("SELECT id FROM contractors WHERE user_id = ?", (user["id"],))
        existing = row_to_dict(cur.fetchone())
        if existing:
            cid = existing["id"]
            cur.execute(
                """
                UPDATE contractors SET
                    business_name = ?, owner_name = ?, phone = ?, email = ?,
                    service_categories = ?, experience_years = ?, daily_rate = ?,
                    description = ?, city = ?, neighbourhood = ?, working_areas = ?,
                    address = ?, latitude = ?, longitude = ?, is_available = ?
                WHERE id = ?
                """,
                (
                    body.business_name.strip(),
                    body.owner_name.strip() or user["name"],
                    body.phone.strip(),
                    body.email.strip() or user["email"],
                    json.dumps(body.service_categories),
                    body.experience_years,
                    body.daily_rate,
                    body.description.strip(),
                    body.city.strip().lower(),
                    body.neighbourhood.strip(),
                    json.dumps(body.working_areas),
                    body.address.strip(),
                    body.latitude,
                    body.longitude,
                    1 if body.is_available else 0,
                    cid,
                ),
            )
        else:
            cid = new_id("ctr")
            cur.execute(
                """
                INSERT INTO contractors (
                    id, user_id, business_name, owner_name, phone, email,
                    service_categories, experience_years, daily_rate, description,
                    city, neighbourhood, working_areas, address, latitude, longitude,
                    is_available, registration_status, verification_status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'checkster_registered', 'pending', ?)
                """,
                (
                    cid,
                    user["id"],
                    body.business_name.strip(),
                    body.owner_name.strip() or user["name"],
                    body.phone.strip(),
                    body.email.strip() or user["email"],
                    json.dumps(body.service_categories),
                    body.experience_years,
                    body.daily_rate,
                    body.description.strip(),
                    body.city.strip().lower(),
                    body.neighbourhood.strip(),
                    json.dumps(body.working_areas),
                    body.address.strip(),
                    body.latitude,
                    body.longitude,
                    1 if body.is_available else 0,
                    now_iso(),
                ),
            )
            if user.get("role") == "homeowner":
                cur.execute("UPDATE users SET role = 'contractor' WHERE id = ?", (user["id"],))
        cur.execute("SELECT * FROM contractors WHERE id = ?", (cid,))
        row = row_to_dict(cur.fetchone())
    return {"contractor": _format_contractor(row) if row else None}


@app.get("/api/contractors/me")
async def get_my_contractor_profile(user: dict[str, Any] = Depends(get_current_user)):
    with db_cursor(commit=False) as cur:
        cur.execute("SELECT * FROM contractors WHERE user_id = ?", (user["id"],))
        row = row_to_dict(cur.fetchone())
        if not row:
            return {"contractor": None, "reviews": [], "requests": []}
        cid = row["id"]
        cur.execute("SELECT * FROM contractor_reviews WHERE contractor_id = ? ORDER BY created_at DESC", (cid,))
        reviews = [row_to_dict(r) for r in cur.fetchall()]
        cur.execute(
            """
            SELECT * FROM repair_requests
            WHERE contractor_id = ? OR (contractor_id IS NULL AND lower(city) = lower(?))
            ORDER BY created_at DESC
            """,
            (cid, row.get("city", "peshawar")),
        )
        requests = [row_to_dict(r) for r in cur.fetchall()]
    return {
        "contractor": _format_contractor(row),
        "reviews": reviews,
        "requests": requests,
    }


@app.post("/api/contractors/me/verification")
async def submit_contractor_verification(
    notes: str = Form(default="", description="Trade license / reference details"),
    document: UploadFile | None = File(default=None),
    user: dict[str, Any] = Depends(get_current_user),
):
    with db_cursor(commit=True) as cur:
        cur.execute("SELECT * FROM contractors WHERE user_id = ?", (user["id"],))
        row = row_to_dict(cur.fetchone())
        if not row:
            raise HTTPException(404, "Please save your contractor profile first.")
        doc_id = row.get("verification_doc_url", "")
        if document:
            raw = await document.read()
            check_size(raw)
            if is_pdf(raw):
                doc_id = store_private_file(raw, "application/pdf", prefix="ver")
            else:
                img, mime = sanitize_image(raw)
                doc_id = store_private_file(img, mime, prefix="ver")
        cur.execute(
            """
            UPDATE contractors SET
                verification_status = 'submitted',
                verification_notes = ?,
                verification_doc_url = ?
            WHERE id = ?
            """,
            (notes.strip(), doc_id, row["id"]),
        )
        cur.execute("SELECT * FROM contractors WHERE id = ?", (row["id"],))
        updated = row_to_dict(cur.fetchone())
    return {"contractor": _format_contractor(updated) if updated else None}


@app.get("/api/contractors/{contractor_id}")
async def get_contractor_detail(contractor_id: str):
    with db_cursor(commit=False) as cur:
        cur.execute("SELECT * FROM contractors WHERE id = ?", (contractor_id,))
        row = row_to_dict(cur.fetchone())
        if not row:
            raise HTTPException(404, "Contractor not found.")
        cur.execute("SELECT * FROM contractor_reviews WHERE contractor_id = ? ORDER BY created_at DESC", (contractor_id,))
        reviews = [row_to_dict(r) for r in cur.fetchall()]
        avg_r = sum(int(r["rating"]) for r in reviews if r) / len(reviews) if reviews else 0.0
    return {
        "contractor": _format_contractor(row, {contractor_id: (avg_r, len(reviews))}),
        "reviews": reviews,
    }


@app.post("/api/contractors/{contractor_id}/reviews")
async def add_contractor_review(
    contractor_id: str,
    body: ContractorReviewRequest,
    user: dict[str, Any] = Depends(get_current_user),
):
    with db_cursor(commit=True) as cur:
        cur.execute("SELECT id FROM contractors WHERE id = ?", (contractor_id,))
        if not cur.fetchone():
            raise HTTPException(404, "Contractor not found.")
        rid = new_id("rev")
        cur.execute(
            """
            INSERT INTO contractor_reviews (id, contractor_id, user_id, user_name, rating, review, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (rid, contractor_id, user["id"], user["name"], body.rating, body.review.strip(), now_iso()),
        )
    return {"status": "ok", "id": rid}


# ---------------------------------------------------------------------------
# Saved Contractors & Repair Requests
# ---------------------------------------------------------------------------
@app.get("/api/saved-contractors")
async def list_saved_contractors(user: dict[str, Any] = Depends(get_current_user)):
    with db_cursor(commit=False) as cur:
        cur.execute("SELECT * FROM saved_contractors WHERE user_id = ? ORDER BY created_at DESC", (user["id"],))
        rows = [row_to_dict(r) for r in cur.fetchall()]
    return {
        "saved": [
            {
                "id": r["id"],
                "contractor_id": r.get("contractor_id"),
                "google_place_id": r.get("google_place_id"),
                "snapshot": parse_json_field(r.get("snapshot_json"), {}),
                "created_at": r["created_at"],
            }
            for r in rows
            if r
        ]
    }


@app.post("/api/saved-contractors")
async def save_contractor(body: SavedContractorRequest, user: dict[str, Any] = Depends(get_current_user)):
    sid = new_id("sav")
    with db_cursor(commit=True) as cur:
        cur.execute(
            """
            INSERT INTO saved_contractors (id, user_id, contractor_id, google_place_id, snapshot_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (sid, user["id"], body.contractor_id, body.google_place_id, json.dumps(body.snapshot, ensure_ascii=False), now_iso()),
        )
    return {"id": sid, "status": "saved"}


@app.delete("/api/saved-contractors/{saved_id}")
async def delete_saved_contractor(saved_id: str, user: dict[str, Any] = Depends(get_current_user)):
    with db_cursor(commit=True) as cur:
        cur.execute("DELETE FROM saved_contractors WHERE id = ? AND user_id = ?", (saved_id, user["id"]))
    return {"status": "deleted"}


@app.post("/api/repair-requests")
async def create_repair_request(body: RepairRequestCreate, user: dict[str, Any] = Depends(get_current_user)):
    rid = new_id("req")
    ts = now_iso()
    with db_cursor(commit=True) as cur:
        cur.execute(
            """
            INSERT INTO repair_requests (
                id, user_id, inspection_id, contractor_id, trade, title,
                description, city, neighbourhood, offered_price, status, scheduled_date, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
            """,
            (
                rid, user["id"], body.inspection_id, body.contractor_id, body.trade,
                body.title.strip(), body.description.strip(), body.city.strip().lower(),
                body.neighbourhood.strip(), body.offered_price, body.scheduled_date, ts,
            ),
        )
        if body.inspection_id:
            cur.execute("UPDATE inspections SET status = 'repair_requested', updated_at = ? WHERE id = ?", (ts, body.inspection_id))
        cur.execute("SELECT * FROM repair_requests WHERE id = ?", (rid,))
        row = row_to_dict(cur.fetchone())
    return {"request": row}


@app.get("/api/repair-requests")
async def list_repair_requests(user: dict[str, Any] = Depends(get_current_user)):
    with db_cursor(commit=False) as cur:
        cur.execute("SELECT * FROM repair_requests WHERE user_id = ? ORDER BY created_at DESC", (user["id"],))
        rows = [row_to_dict(r) for r in cur.fetchall()]
    return {"requests": rows}


@app.patch("/api/repair-requests/{request_id}")
async def update_repair_request(
    request_id: str,
    body: RepairRequestUpdate,
    user: dict[str, Any] = Depends(get_current_user),
):
    allowed = {"accepted", "countered", "rejected", "scheduled", "completed", "cancelled"}
    if body.status not in allowed:
        raise HTTPException(400, f"Status must be one of {sorted(allowed)}")

    with db_cursor(commit=True) as cur:
        cur.execute("SELECT * FROM repair_requests WHERE id = ?", (request_id,))
        req = row_to_dict(cur.fetchone())
        if not req:
            raise HTTPException(404, "Repair request not found.")
        cur.execute("SELECT id FROM contractors WHERE user_id = ?", (user["id"],))
        my_ctr = row_to_dict(cur.fetchone())

        cid = my_ctr["id"] if my_ctr else req.get("contractor_id")
        cur.execute(
            """
            UPDATE repair_requests SET
                status = ?,
                contractor_id = COALESCE(contractor_id, ?),
                counter_price = COALESCE(?, counter_price),
                scheduled_date = COALESCE(?, scheduled_date)
            WHERE id = ?
            """,
            (body.status, cid, body.counter_price, body.scheduled_date, request_id),
        )
        if body.status == "completed" and req.get("inspection_id"):
            cur.execute("UPDATE inspections SET status = 'completed', updated_at = ? WHERE id = ?", (now_iso(), req["inspection_id"]))
        cur.execute("SELECT * FROM repair_requests WHERE id = ?", (request_id,))
        updated = row_to_dict(cur.fetchone())
    return {"request": updated}


# ---------------------------------------------------------------------------
# Admin Dashboard & Verification Workflow
# ---------------------------------------------------------------------------
@app.get("/api/admin/overview")
async def admin_overview(_: dict[str, Any] = Depends(require_admin)):
    with db_cursor(commit=False) as cur:
        cur.execute("SELECT * FROM contractors ORDER BY created_at DESC")
        contractors = [_format_contractor(row_to_dict(r)) for r in cur.fetchall() if r]
        cur.execute("SELECT COUNT(*) as c FROM users")
        users_count = cur.fetchone()["c"]
        cur.execute("SELECT COUNT(*) as c FROM inspections")
        insp_count = cur.fetchone()["c"]
        cur.execute("SELECT COUNT(*) as c FROM quotations")
        quotes_count = cur.fetchone()["c"]
    return {
        "counts": {"users": users_count, "inspections": insp_count, "quotations": quotes_count, "contractors": len(contractors)},
        "contractors": contractors,
    }


@app.patch("/api/admin/contractors/{contractor_id}/verify")
async def admin_verify_contractor(
    contractor_id: str,
    body: VerificationReviewRequest,
    _: dict[str, Any] = Depends(require_admin),
):
    if body.verification_status not in ("pending", "submitted", "under_review", "verified", "rejected"):
        raise HTTPException(400, "Invalid verification status.")
    with db_cursor(commit=True) as cur:
        cur.execute("SELECT id FROM contractors WHERE id = ?", (contractor_id,))
        if not cur.fetchone():
            raise HTTPException(404, "Contractor not found.")
        cur.execute(
            "UPDATE contractors SET verification_status = ?, verification_notes = ? WHERE id = ?",
            (body.verification_status, body.verification_notes.strip(), contractor_id),
        )
        cur.execute("SELECT * FROM contractors WHERE id = ?", (contractor_id,))
        updated = row_to_dict(cur.fetchone())
    return {"contractor": _format_contractor(updated) if updated else None}
