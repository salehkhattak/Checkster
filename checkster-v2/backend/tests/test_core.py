"""Unit tests — deterministic audit, pricing, schemas and upload validation (no network)."""
import io
import os

os.environ.setdefault("GEMINI_API_KEY", "test-key-not-real")

import pytest  # noqa: E402
from PIL import Image  # noqa: E402
from pydantic import ValidationError  # noqa: E402

from app.schemas import ExtractedQuote, InspectionResult  # noqa: E402
from app.services.audit import audit_quote, compute_line_total  # noqa: E402
from app.services.gemini import _normalise_model  # noqa: E402
from app.services.ocr import UploadError, sanitize_image  # noqa: E402
from app.services.pricing import estimate_repair_cost, labour_day_range  # noqa: E402

SAMPLE = [
    {"description": "Wall scraping", "quantity": None, "unit": "", "total_price": 8000},
    {"description": "Chemical waterproof coating", "quantity": None, "unit": "", "total_price": 22000},
    {"description": "Putty and paint", "quantity": None, "unit": "", "total_price": 15000},
    {"description": "Labour", "quantity": None, "unit": "", "total_price": 12000},
]


def ids(findings):
    return {f.id for f in findings}


def test_line_total():
    assert compute_line_total(SAMPLE) == 57000


def test_total_mismatch_detected():
    f = audit_quote(SAMPLE, 60000)
    m = next(x for x in f if x.id == "total_mismatch")
    assert m.data["difference"] == 3000 and m.classification == "arithmetic_error"


def test_total_ok_not_flagged():
    assert "total_mismatch" not in ids(audit_quote(SAMPLE, 57000))


def test_surface_only_and_missing_qty_and_spec():
    got = ids(audit_quote(SAMPLE, 57000))
    assert {"surface_only", "missing_qty", "waterproof_spec"} <= got


def test_line_arithmetic():
    items = [{"description": "Plaster", "quantity": 100, "unit": "sq ft", "unit_price": 50, "total_price": 7000}]
    f = next(x for x in audit_quote(items, None) if x.id.startswith("line_math"))
    assert f.data["expected"] == 5000


def test_duplicates_and_double_labour():
    items = [
        {"description": "Putty", "quantity": 10, "unit": "sq ft", "total_price": 100},
        {"description": "putty", "quantity": 10, "unit": "sq ft", "total_price": 100},
        {"description": "Labour mason", "total_price": 2000},
        {"description": "Labour painter", "total_price": 2000},
    ]
    got = ids(audit_quote(items, None))
    assert any(i.startswith("dup_") for i in got) and "double_labour" in got


def test_labour_rate_overpriced():
    items = [{"description": "Mason labour", "quantity": 2, "unit": "day", "unit_price": 6000, "total_price": 12000, "category": "labour"}]
    assert any(f.classification == "potentially_overpriced" for f in audit_quote(items, None))


def test_diagnosis_gap_and_unneeded_waterproofing():
    got = ids(audit_quote(SAMPLE, 57000, diagnosis={"primary_trade": "plumber", "final_cause": "pipe leak"}))
    assert {"diagnosis_gap", "waterproof_maybe_unneeded"} <= got


def test_suspiciously_low():
    items = [{"description": "Fix leak pipe", "quantity": 1, "unit": "job", "total_price": 1000}]
    assert "suspiciously_low" in ids(audit_quote(items, 1000, estimate_low=10000))


def test_missing_amount_not_invented():
    items = [{"description": "Plaster", "quantity": 10, "unit": "sq ft", "total_price": None}]
    f = audit_quote(items, None)
    assert "missing_amount" in ids(f) and compute_line_total(items) == 0


def test_kp_city_uses_pbs_note():
    lo, hi, _, note = labour_day_range("mason", "Peshawar")
    assert lo == 1987 and hi == 2000 and "KP" in note


def test_estimate_deterministic():
    plan = [{"step": "Fix pipe", "trade": "plumber", "estimated_days": 1},
            {"step": "Re-plaster", "trade": "mason", "estimated_days": 2}]
    a, b = estimate_repair_cost(plan, 40, "lahore"), estimate_repair_cost(plan, 40, "lahore")
    assert a == b and a["total_low"] < a["total_high"]
    assert any(r["source_type"] == "sample" for r in a["rows"])


def test_inspection_schema_rejects_bad_confidence():
    with pytest.raises(ValidationError):
        InspectionResult.model_validate({
            "image_usable": True, "issue_category": "dampness", "summary_en": "x", "summary_ur": "x",
            "observations": [{"observation": "a", "evidence": "b", "confidence": 1.7}],
            "possible_causes": [], "severity": "moderate", "severity_reason": "", "additional_questions": [],
            "recommended_next_steps": [], "limitations": [],
        })


def test_quote_schema_rejects_bad_category():
    with pytest.raises(ValidationError):
        ExtractedQuote.model_validate({"is_quotation": True, "line_items": [{"description": "x", "category": "food"}],
                                       "extraction_confidence": 0.5, "language_detected": "en", "needs_user_review": False})


def test_sanitize_image_strips_and_converts():
    buf = io.BytesIO()
    Image.new("RGBA", (3000, 1000), (200, 100, 50, 255)).save(buf, format="PNG")
    out, mime = sanitize_image(buf.getvalue())
    img = Image.open(io.BytesIO(out))
    assert mime == "image/jpeg" and max(img.size) <= 2048 and not img.info.get("exif")


def test_sanitize_rejects_non_image():
    with pytest.raises(UploadError):
        sanitize_image(b"not an image at all")


def test_model_name_shorthand():
    assert _normalise_model("3.8-flash") == "gemini-3.8-flash"
    assert _normalise_model("models/gemini-2.5-flash") == "gemini-2.5-flash"
