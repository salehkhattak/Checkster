"""
Deterministic quote audit engine — NO AI, all maths in Python.
Pipeline: OCR -> structured extraction -> normalisation -> reference lookup -> THIS -> AI explanation.
Ports and extends lib/audit.ts.
"""
from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field
from typing import Literal

from app.services.pricing import labour_day_range

Severity = Literal["high", "medium", "info"]
Classification = Literal[
    "potentially_overpriced", "missing_information", "potential_duplicate",
    "unsupported_repair", "reasonable", "needs_manual_verification", "arithmetic_error",
]

SURFACE_WORDS = ["paint", "putty", "coating", "scrap", "plaster", "distemper", "rang", "primer", "safedi"]
SOURCE_WORDS = ["leak", "pipe", "plumb", "seal", "drain", "damp proof", "dpc", "inspect", "source", "test", "joint", "nali"]
TREATMENT_WORDS = ["coating", "waterproof", "chemical"]
LABOUR_WORDS = ["labour", "labor", "mazdoori", "mazduri", "مزدوری", "kaarigar", "karigar", "worker", "mistri"]
DAY_UNITS = {"day", "days", "din", "دن", "per day", "worker-day"}
TRADE_WORDS = {
    "plumber": ["plumb", "pipe", "leak", "joint", "tap", "drain"],
    "mason": ["plaster", "mason", "mistri", "brick", "dpc", "damp proof"],
    "waterproofing": ["waterproof", "coating", "chemical", "membrane", "seal"],
    "painter": ["paint", "putty", "primer", "distemper"],
}


@dataclass
class AuditFinding:
    id: str
    severity: Severity
    classification: Classification
    title_en: str
    title_ur: str
    item: str
    explain_en: str
    explain_ur: str
    ask_en: str
    ask_ur: str
    data: dict = field(default_factory=dict)


def _fmt(n: float) -> str:
    return f"{round(n):,}"


def _has(text: str, words: list[str]) -> bool:
    t = text.lower()
    return any(w in t for w in words)


def _num(v) -> float | None:
    try:
        return None if v is None or v == "" else float(v)
    except (TypeError, ValueError):
        return None


def _norm(desc: str) -> str:
    return re.sub(r"[^a-z0-9\u0600-\u06ff]+", " ", desc.lower()).strip()


def compute_line_total(items: list[dict]) -> float:
    return sum(_num(i.get("total_price")) or 0 for i in items if str(i.get("description", "")).strip())


def audit_quote(
    items: list[dict],
    stated_total: float | None,
    diagnosis: dict | None = None,
    estimate_low: float | None = None,
    city: str = "",
) -> list[AuditFinding]:
    out: list[AuditFinding] = []
    clean = [i for i in items if str(i.get("description", "")).strip()]
    all_text = " ".join(str(i.get("description", "")) for i in clean)
    computed = compute_line_total(clean)

    # 0. Lines without a readable amount
    no_amount = [i for i in clean if _num(i.get("total_price")) is None]
    if no_amount:
        out.append(AuditFinding(
            "missing_amount", "medium", "needs_manual_verification",
            "Some lines have no amount", "کچھ لائنوں میں رقم نہیں",
            ", ".join(i["description"] for i in no_amount[:4]),
            "These lines have no readable price, so they are excluded from the totals. Please confirm them.",
            "ان لائنوں میں رقم واضح نہیں، اس لیے انہیں جوڑ میں شامل نہیں کیا گیا۔ تصدیق کریں۔",
            "What is the price for each of these items?", "ان آئٹمز کی قیمت کیا ہے؟",
        ))

    # 1. Grand total arithmetic
    if stated_total is not None and abs(computed - stated_total) > 1:
        diff = stated_total - computed
        out.append(AuditFinding(
            "total_mismatch", "high", "arithmetic_error",
            "The total doesn't add up", "کل رقم جمع نہیں ہو رہی", "Total",
            f"The line items add up to Rs {_fmt(computed)}, but the quote states Rs {_fmt(stated_total)} "
            f"({'Rs ' + _fmt(diff) + ' more' if diff > 0 else 'Rs ' + _fmt(-diff) + ' less'}).",
            f"آئٹمز کا جوڑ {_fmt(computed)} روپے ہے مگر تخمینے میں {_fmt(stated_total)} روپے لکھا ہے۔",
            "Can you explain the difference between the line items and the grand total?",
            "کل رقم اور لائنوں کے جوڑ میں فرق کی وضاحت کریں؟",
            {"computed_total": computed, "stated_total": stated_total, "difference": diff},
        ))

    # 2. Line arithmetic: qty x unit price
    for idx, i in enumerate(clean):
        q, up, tot = _num(i.get("quantity")), _num(i.get("unit_price")), _num(i.get("total_price"))
        if q and up and tot is not None and abs(q * up - tot) > max(10, tot * 0.02):
            out.append(AuditFinding(
                f"line_math_{idx}", "high", "arithmetic_error",
                "Line total doesn't match quantity × rate", "لائن کا جوڑ مقدار × ریٹ سے مختلف ہے", i["description"],
                f"{q:g} × Rs {_fmt(up)} = Rs {_fmt(q * up)}, but the line says Rs {_fmt(tot)}.",
                f"{q:g} × {_fmt(up)} روپے = {_fmt(q * up)} روپے، مگر لکھا ہے {_fmt(tot)} روپے۔",
                f"Please recheck the calculation for '{i['description']}'.", f"'{i['description']}' کا حساب دوبارہ چیک کریں۔",
                {"quantity": q, "unit_price": up, "expected": q * up, "stated": tot},
            ))

    # 3. Duplicate lines
    seen: dict[str, dict] = {}
    for i in clean:
        k = _norm(i["description"])
        if k and k in seen and not _has(k, LABOUR_WORDS):
            out.append(AuditFinding(
                f"dup_{k[:20]}", "medium", "potential_duplicate",
                "Same item listed twice", "ایک ہی آئٹم دو بار", i["description"],
                "This item appears more than once. It may be intentional (two areas), but should be explained.",
                "یہ آئٹم ایک سے زیادہ بار لکھا ہے۔ ہو سکتا ہے یہ دو جگہوں کے لیے ہو، مگر وضاحت ہونی چاہیے۔",
                f"Why is '{i['description']}' listed twice?", f"'{i['description']}' دو بار کیوں لکھا ہے؟",
            ))
        seen.setdefault(k, i)

    # 4. Surface-only work
    if _has(all_text, SURFACE_WORDS) and not _has(all_text, SOURCE_WORDS):
        out.append(AuditFinding(
            "surface_only", "high", "unsupported_repair",
            "Nothing fixes where the water comes from", "پانی کے ذریعے کو ٹھیک کرنے کا کوئی کام نہیں", "Whole quote",
            "Every item treats the surface of the wall. If the source isn't fixed first, the seelan can come back within months.",
            "ہر آئٹم صرف دیوار کی سطح کا ہے۔ اگر پہلے ذریعہ ٹھیک نہ ہو تو سیلن چند مہینوں میں واپس آ سکتی ہے۔",
            "What is causing the moisture, and how will you fix that before plaster or paint?",
            "نمی کی وجہ کیا ہے، اور پلستر یا رنگ سے پہلے آپ اسے کیسے ٹھیک کریں گے؟",
        ))

    # 5. Missing measurements
    no_qty = [i for i in clean if not _has(i["description"], LABOUR_WORDS)
              and (_num(i.get("quantity")) is None or not str(i.get("unit") or "").strip())]
    if no_qty:
        out.append(AuditFinding(
            "missing_qty", "medium", "missing_information",
            "No measurements written", "پیمائش نہیں لکھی گئی", ", ".join(i["description"] for i in no_qty[:4]),
            "These lines have no size (sq ft, litres, bags), so nobody can check whether the amount fits your wall.",
            "ان لائنوں میں سائز نہیں لکھا (مربع فٹ، لیٹر، بوری)، اس لیے رقم کی جانچ نہیں ہو سکتی۔",
            "How many square feet / litres does each item cover?", "ہر کام کتنے مربع فٹ / لیٹر کا ہے؟",
        ))

    # 6. Unspecified waterproofing product
    for i in clean:
        if _has(i["description"], TREATMENT_WORDS) and len(i["description"].split()) < 5:
            out.append(AuditFinding(
                "waterproof_spec", "medium", "missing_information",
                "Which product? How many coats?", "کون سا پراڈکٹ؟ کتنے کوٹ؟", i["description"],
                "The waterproofing brand, product and number of coats are not written. Two coatings at the same price can be very different.",
                "واٹر پروفنگ کا برانڈ، پراڈکٹ اور کوٹ کی تعداد نہیں لکھی۔",
                "Which brand and product will you use, and how many coats?", "کون سا برانڈ اور پراڈکٹ، اور کتنے کوٹ؟",
            ))
            break

    # 7. Labour: duplicates + missing breakdown + rate comparison
    labour = [i for i in clean if _has(i["description"], LABOUR_WORDS) or i.get("category") == "labour"]
    if len(labour) >= 2:
        out.append(AuditFinding(
            "double_labour", "medium", "potential_duplicate",
            "Labour appears more than once", "مزدوری ایک سے زیادہ بار", "Labour",
            f"Labour is charged {len(labour)} times. It may be fine for different trades, but each should be explained.",
            f"مزدوری {len(labour)} بار لکھی ہے۔ ہر ایک کی وضاحت ہونی چاہیے۔",
            "What does each labour charge cover (which worker, how many days)?", "ہر مزدوری کس کام کی ہے (کون سا کاریگر، کتنے دن)؟",
        ))
    if not labour and len(clean) >= 2:
        out.append(AuditFinding(
            "no_labour_breakdown", "info", "missing_information",
            "Labour not shown separately", "مزدوری الگ نہیں لکھی", "Whole quote",
            "Labour and materials are mixed together, so it's hard to compare with official labour rates.",
            "مزدوری اور سامان ملا کر لکھے ہیں، اس لیے سرکاری ریٹ سے موازنہ مشکل ہے۔",
            "Can you split labour and materials, and say how many worker-days?", "مزدوری اور سامان الگ کر دیں اور کاریگر-دن بتائیں؟",
        ))
    lo, hi, ref_ids, note = labour_day_range("mason", city)
    for idx, i in enumerate(labour):
        unit = str(i.get("unit") or "").lower().strip()
        up = _num(i.get("unit_price"))
        if unit in DAY_UNITS and up:
            if up > hi * 1.5:
                out.append(AuditFinding(
                    f"labour_rate_high_{idx}", "medium", "potentially_overpriced",
                    "Daily labour rate is well above official reference", "روزانہ مزدوری سرکاری ریٹ سے کافی زیادہ", i["description"],
                    f"Rs {_fmt(up)}/day vs official reference Rs {_fmt(lo)}–{_fmt(hi)}/day. Private rates are often higher, but this is over 1.5× the upper reference.",
                    f"{_fmt(up)} روپے فی دن، جبکہ سرکاری ریٹ {_fmt(lo)}–{_fmt(hi)} روپے فی دن ہے۔",
                    "Why is the daily rate higher than usual? Is it a specialist?", "روزانہ ریٹ زیادہ کیوں ہے؟ کیا یہ ماہر کاریگر ہے؟",
                    {"unit_price": up, "reference_low": lo, "reference_high": hi, "reference_ids": ref_ids, "note": note},
                ))
            elif up <= hi * 1.5:
                out.append(AuditFinding(
                    f"labour_rate_ok_{idx}", "info", "reasonable",
                    "Daily labour rate within reference range", "روزانہ مزدوری مناسب حد میں", i["description"],
                    f"Rs {_fmt(up)}/day is within 1.5× the official reference (Rs {_fmt(lo)}–{_fmt(hi)}/day).",
                    f"{_fmt(up)} روپے فی دن سرکاری حوالے کے قریب ہے۔",
                    "How many days will the work take?", "کام کتنے دن کا ہے؟",
                    {"unit_price": up, "reference_low": lo, "reference_high": hi, "reference_ids": ref_ids},
                ))
    labour_total = sum(_num(i.get("total_price")) or 0 for i in labour)
    if labour_total > 0:
        days = labour_total / hi
        out.append(AuditFinding(
            "labour_days", "info", "needs_manual_verification",
            "Labour compared to official rate", "مزدوری بمقابلہ سرکاری ریٹ", "Labour",
            f"Rs {_fmt(labour_total)} ≈ {days:.1f} worker-days at the official reference of Rs {_fmt(hi)}/day. "
            f"Fair if that many workers × days are really needed. {note}",
            f"{_fmt(labour_total)} روپے ≈ {days:.1f} کاریگر-دن (سرکاری ریٹ {_fmt(hi)} روپے فی دن)۔",
            "How many workers will come, and for how many days?", "کتنے کاریگر آئیں گے، اور کتنے دن؟",
            {"labour_total": labour_total, "reference_rate": hi, "worker_days": round(days, 1), "reference_ids": ref_ids},
        ))

    # 8. Consistency with the AI diagnosis
    if diagnosis:
        trade = diagnosis.get("primary_trade")
        if trade in TRADE_WORDS and not _has(all_text, TRADE_WORDS[trade]):
            out.append(AuditFinding(
                "diagnosis_gap", "high", "unsupported_repair",
                "Quote doesn't include the repair the inspection points to", "تخمینے میں وہ کام نہیں جو معائنے نے بتایا",
                "Whole quote",
                f"The inspection suggests a {trade} should address '{diagnosis.get('final_cause', 'the cause')}' first, but no such work is in the quote.",
                f"معائنے کے مطابق پہلے {trade} کا کام ضروری ہے، مگر تخمینے میں یہ شامل نہیں۔",
                f"Will a {trade} check and fix the source first? Why isn't it in the quote?",
                "کیا پہلے ذریعہ ٹھیک کیا جائے گا؟ یہ تخمینے میں کیوں نہیں؟",
                {"primary_trade": trade},
            ))
        if trade == "plumber" and _has(all_text, ["waterproof", "chemical"]):
            out.append(AuditFinding(
                "waterproof_maybe_unneeded", "medium", "unsupported_repair",
                "Waterproofing may not be needed yet", "واٹر پروفنگ شاید ابھی ضروری نہ ہو", "Waterproofing",
                "The inspection points to a pipe leak. Waterproofing coatings don't fix a leaking pipe; fix the leak and let the wall dry first.",
                "معائنہ پائپ لیک کی طرف اشارہ کرتا ہے۔ واٹر پروف کوٹنگ پائپ لیک ٹھیک نہیں کرتی۔",
                "Is the waterproofing really needed if the pipe is fixed?", "اگر پائپ ٹھیک ہو جائے تو کیا واٹر پروفنگ ضروری ہے؟",
            ))

    # 9. Suspiciously low vs estimate
    if estimate_low and computed > 0 and computed < 0.5 * estimate_low:
        out.append(AuditFinding(
            "suspiciously_low", "medium", "needs_manual_verification",
            "Quote is much lower than the estimate", "تخمینہ اندازے سے بہت کم", "Total",
            f"Rs {_fmt(computed)} is under half of Checkster's lower estimate (Rs {_fmt(estimate_low)}). Essential work may be missing.",
            f"{_fmt(computed)} روپے چیکسٹر کے کم از کم اندازے ({_fmt(estimate_low)} روپے) کے آدھے سے کم ہے۔",
            "Does this price include all materials and fixing the source of the problem?",
            "کیا اس قیمت میں تمام سامان اور مسئلے کی جڑ ٹھیک کرنا شامل ہے؟",
            {"computed_total": computed, "estimate_low": estimate_low},
        ))
    return out


def findings_to_dict(findings: list[AuditFinding]) -> list[dict]:
    res = []
    for f in findings:
        d = asdict(f)
        res.append({
            "id": d["id"], "severity": d["severity"], "classification": d["classification"], "item": d["item"],
            "title": {"en": d["title_en"], "ur": d["title_ur"]},
            "explain": {"en": d["explain_en"], "ur": d["explain_ur"]},
            "ask": {"en": d["ask_en"], "ur": d["ask_ur"]},
            "data": d["data"],
        })
    return res
