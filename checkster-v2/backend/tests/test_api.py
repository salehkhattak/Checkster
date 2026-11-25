"""Integration tests for Checkster API endpoints, database persistence, auth, and AI/OCR pipeline."""
import asyncio
import io
import os
import tempfile
from pathlib import Path

os.environ.setdefault("GEMINI_API_KEY", "test-key-not-real")
_TMP_DIR = tempfile.mkdtemp(prefix="checkster_test_")
os.environ["CHECKSTER_DATA_DIR"] = _TMP_DIR
os.environ["CHECKSTER_DB_PATH"] = str(Path(_TMP_DIR) / "test_checkster.db")

import pytest  # noqa: E402
from fastapi import HTTPException, UploadFile  # noqa: E402
from PIL import Image  # noqa: E402

from app import main  # noqa: E402
from app.schemas import AuditExplanation, ExtractedQuote, InspectionResult, RefinedDiagnosis  # noqa: E402
from app.services.gemini import AIRateLimited  # noqa: E402


def _run(coro):
    return asyncio.run(coro)


def _jpeg_bytes() -> bytes:
    b = io.BytesIO()
    Image.new("RGB", (96, 96), (120, 110, 90)).save(b, format="JPEG")
    return b.getvalue()


def _upload_file(name: str, data: bytes, content_type: str = "image/jpeg") -> UploadFile:
    return UploadFile(filename=name, file=io.BytesIO(data), headers={"content-type": content_type})


FAKE_INSPECTION = InspectionResult.model_validate({
    "image_usable": True,
    "issue_category": "dampness",
    "summary_en": "Lower wall moisture staining and peeling paint observed.",
    "summary_ur": "دیوار کے نچلے حصے میں نمی کے دھبے اور اکھڑتا رنگ۔",
    "observations": [
        {"observation": "Visible moisture staining", "evidence": "Dark patches near skirting", "location_hint": "bottom-left", "confidence": 0.87}
    ],
    "possible_causes": [
        {"cause": "Concealed plumbing leak", "probability": 0.65, "explanation": "Concentrated dark stain", "specialist": "plumbing"}
    ],
    "severity": "moderate",
    "severity_reason": "Active dampness affecting plaster",
    "additional_questions": [
        {"id": "bathroom", "question_en": "Is a bathroom behind this wall?", "question_ur": "کیا پیچھے باتھ روم ہے؟", "why": "Checks plumbing source"}
    ],
    "recommended_next_steps": ["Pressure-test adjacent water lines"],
    "safety_warnings": ["Keep electrical sockets dry"],
    "limitations": ["Cannot see inside wall cavity from photo"],
})

FAKE_DIAGNOSIS = RefinedDiagnosis.model_validate({
    "problem_summary_en": "Damp wall likely caused by concealed pipe leak.",
    "problem_summary_ur": "چھپے ہوئے پائپ لیک کی وجہ سے دیوار میں سیلن۔",
    "final_cause": "Concealed plumbing joint leakage",
    "final_cause_ur": "دیوار کے اندر پائپ جوڑ کا لیک",
    "cause_explanation": "Bathroom behind wall + localized stain indicates pipe leak.",
    "confidence": 0.78,
    "confidence_label": "likely",
    "severity": "moderate",
    "specialists_consulted": [
        {"specialist": "plumbing", "supports_cause": "Pipe joint leak", "reasoning": "Bathroom on opposite side", "agrees": True},
        {"specialist": "masonry", "supports_cause": "Re-plaster after drying", "reasoning": "Salt damage on plaster", "agrees": True},
    ],
    "conflicts_resolved": "Plumbing source must be fixed before masonry repair.",
    "repair_plan": [
        {"step": "Pressure test and fix leaking joint", "trade": "plumber", "materials": ["PPRC sleeve"], "estimated_days": 1, "safety_level": "professional_recommended"},
        {"step": "Scrape and re-plaster damaged area", "trade": "mason", "materials": ["Cement", "Sand"], "estimated_days": 1.5, "safety_level": "professional_recommended"},
    ],
    "primary_trade": "plumber",
    "safety_warnings": ["Turn off breaker if dampness reaches socket"],
    "limitations": ["Confirm with on-site pressure test"],
    "professional_inspection_required": True,
})

FAKE_EXTRACTED_QUOTE = ExtractedQuote.model_validate({
    "is_quotation": True,
    "contractor_name": "Khyber Repair Works",
    "date": "2026-11-20",
    "work_description": "Wall damp repair",
    "line_items": [
        {"description": "Wall scraping", "quantity": None, "unit": "", "unit_price": None, "total_price": 8000, "category": "labour", "unclear": False},
        {"description": "Chemical waterproof coating", "quantity": None, "unit": "", "unit_price": None, "total_price": 22000, "category": "material", "unclear": False},
    ],
    "stated_total": 35000,
    "raw_text": "Wall scraping 8000\nChemical waterproof coating 22000\nTotal 35000",
    "extraction_confidence": 0.9,
    "language_detected": "en",
    "needs_user_review": False,
    "review_notes": [],
})

FAKE_EXPLANATION = AuditExplanation.model_validate({
    "summary_en": "The quote total does not match the line items and omits plumbing leak repair.",
    "summary_ur": "تخمینے کا کل جوڑ لائنوں سے مختلف ہے اور پائپ کی مرمت شامل نہیں۔",
    "summary_roman_ur": "Quote ka total line items se match nahi karta aur pipe leak fix shamil nahi.",
    "finding_explanations": [
        {"id": "total_mismatch", "en": "Items sum to 30,000 vs 35,000 stated.", "ur": "جوڑ 30,000 ہے مگر 35,000 لکھا ہے۔", "roman_ur": "Jor 30,000 hai magar 35,000 likha hai."}
    ],
    "questions_for_contractor_en": ["Can you explain the Rs 5,000 difference?"],
    "questions_for_contractor_ur": ["کیا آپ 5,000 روپے کے فرق کی وضاحت کر سکتے ہیں؟"],
})


def test_health_hides_key():
    res = _run(main.health())
    assert res["status"] == "ok"
    assert "test-key" not in str(res)


def test_registration_login_and_profile_persistence():
    reg = _run(main.api_register(main.RegisterRequest(
        name="Saleh Khattak",
        email="saleh@example.com",
        password="securepassword123",
        phone="03001234567",
        city="peshawar",
        neighbourhood="Hayatabad",
        preferred_language="en",
        role="homeowner",
    )))
    assert reg["user"]["email"] == "saleh@example.com"
    assert "password" not in str(reg["user"])
    assert reg["access_token"]

    login = _run(main.api_login(main.LoginRequest(email="saleh@example.com", password="securepassword123")))
    assert login["user"]["id"] == reg["user"]["id"]

    # Wrong password rejected
    with pytest.raises(HTTPException) as exc:
        _run(main.api_login(main.LoginRequest(email="saleh@example.com", password="wrongpassword")))
    assert exc.value.status_code == 401


def test_full_homeowner_inspection_to_quote_audit_journey(monkeypatch):
    async def fake_inspect(*a, **k):
        return FAKE_INSPECTION

    async def fake_refine(*a, **k):
        return FAKE_DIAGNOSIS

    async def fake_extract(*a, **k):
        return FAKE_EXTRACTED_QUOTE

    async def fake_explain(*a, **k):
        return FAKE_EXPLANATION

    monkeypatch.setattr(main.gemini_service, "inspect_images", fake_inspect)
    monkeypatch.setattr(main.gemini_service, "refine_diagnosis", fake_refine)
    monkeypatch.setattr(main.gemini_service, "extract_quote_from_image", fake_extract)
    monkeypatch.setattr(main.gemini_service, "explain_audit_findings", fake_explain)

    user = _run(main.api_login(main.LoginRequest(email="saleh@example.com", password="securepassword123")))["user"]

    # 1. Consent required
    with pytest.raises(HTTPException) as exc:
        _run(main.inspect(
            images=[_upload_file("wall.jpg", _jpeg_bytes())],
            category="damp",
            description="Seelan near bathroom",
            room="bedroom",
            city="peshawar",
            neighbourhood="Hayatabad",
            area_sqft=40,
            language="en",
            consent=False,
            inspection_id="",
            user=user,
        ))
    assert exc.value.status_code == 400

    # 2. Upload photo & run AI inspection
    insp = _run(main.inspect(
        images=[_upload_file("wall.jpg", _jpeg_bytes())],
        category="damp",
        description="Seelan near bathroom",
        room="bedroom",
        city="peshawar",
        neighbourhood="Hayatabad",
        area_sqft=40,
        language="en",
        consent=True,
        inspection_id="",
        user=user,
    ))
    insp_id = insp["inspection_id"]
    assert insp["issue_category"] == "dampness"
    assert len(insp["image_urls"]) == 1

    # 3. Answer follow-up questions & refine diagnosis
    refined = _run(main.refine(
        main.RefineRequest(
            initial_inspection=insp,
            followup_answers={"bathroom": "yes", "rain": "no"},
            language="en",
            inspection_id=insp_id,
            area_sqft=40,
            city="peshawar",
        ),
        user=user,
    ))
    assert refined["primary_trade"] == "plumber"
    assert refined["estimate"]["total_low"] > 0

    # 4. Upload quotation image & run OCR extraction
    extracted = _run(main.extract_quote(
        file=_upload_file("quote.jpg", _jpeg_bytes()),
        consent=True,
        inspection_id=insp_id,
        user=user,
    ))
    quote_id = extracted["quotation_id"]
    assert extracted["computed_line_total"] == 30000

    # 5. Run deterministic quote audit
    audited = _run(main.audit(
        main.AuditRequest(
            items=extracted["line_items"],
            stated_total=extracted["stated_total"],
            diagnosis=refined,
            estimate_low=refined["estimate"]["total_low"],
            city="peshawar",
            quotation_id=quote_id,
            inspection_id=insp_id,
            contractor_name=extracted["contractor_name"],
        ),
        user=user,
    ))
    finding_ids = {f["id"] for f in audited["findings"]}
    assert "total_mismatch" in finding_ids
    assert "diagnosis_gap" in finding_ids

    # 6. Explain findings
    explained = _run(main.explain(main.ExplainRequest(
        findings=audited["findings"],
        quote_items=extracted["line_items"],
        diagnosis=refined,
        quotation_id=quote_id,
    )))
    assert explained["summary_ur"]

    # 7. Retrieve persistent inspection report (simulating logout & login reload)
    saved_report = _run(main.get_inspection(insp_id, user=user))
    assert saved_report["status"] == "quote_audited"
    assert len(saved_report["evidence"]) == 1
    assert len(saved_report["recommendations"]) == 2
    assert len(saved_report["quotations"]) == 1
    assert saved_report["quotations"][0]["audited_total"] == 30000


def test_contractor_registration_discovery_and_admin_verification():
    ctr_user = _run(main.api_register(main.RegisterRequest(
        name="Ustad Rahim",
        email="rahim@example.com",
        password="securepassword123",
        phone="03111234567",
        city="peshawar",
        neighbourhood="Hayatabad",
        role="contractor",
    )))["user"]

    profile = _run(main.register_contractor_profile(
        main.ContractorOnboardRequest(
            business_name="Rahim Plumbing & Seepage Experts",
            owner_name="Ustad Rahim",
            phone="03111234567",
            service_categories=["plumber", "waterproofing"],
            experience_years=14,
            daily_rate=2000,
            description="Leak detection and pressure testing in Peshawar",
            city="peshawar",
            neighbourhood="Hayatabad",
            working_areas=["hayatabad", "university-town"],
        ),
        user=ctr_user,
    ))["contractor"]

    # Initially checkster_registered and pending verification (never auto-verified)
    assert profile["listing_status"] == "checkster_registered"
    assert profile["verification_status"] == "pending"

    # Discover contractors in Peshawar
    disc = _run(main.discover_contractors(category="plumber", city="peshawar", neighbourhood="Hayatabad", lat=None, lng=None))
    assert any(c["id"] == profile["id"] and c["listing_status"] == "checkster_registered" for c in disc["checkster_contractors"])

    # Admin verifies contractor
    admin_user = _run(main.api_register(main.RegisterRequest(
        name="Admin User",
        email="admin@checkster.pk",
        password="adminpassword123",
        role="admin",
    )))["user"]

    verified = _run(main.admin_verify_contractor(
        profile["id"],
        main.VerificationReviewRequest(verification_status="verified", verification_notes="Trade references verified by admin"),
        _=admin_user,
    ))["contractor"]
    assert verified["verification_status"] == "verified"
    assert verified["listing_status"] == "checkster_verified"


def test_rate_limit_error_preserved():
    err = AIRateLimited()
    assert err.status_code == 429
