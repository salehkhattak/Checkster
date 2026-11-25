"""Pydantic schemas for every structured Gemini response.

Kept free of dict[str, ...] / free-form objects so they can be passed to
Gemini as `response_schema` and re-validated on our side.
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

IssueCategory = Literal["dampness", "water_leakage", "roof_leakage", "wall_crack", "plumbing", "electrical", "general", "not_a_home_issue"]
SeverityLevel = Literal["low", "moderate", "high", "critical"]


class ObservationItem(BaseModel):
    observation: str = Field(description="Something actually visible in the photo")
    evidence: str = Field(description="The specific visual detail (location, colour, texture) supporting it")
    location_hint: str = Field(default="", description="Where in the image, e.g. 'lower-left corner'")
    confidence: float = Field(ge=0.0, le=1.0)


class PossibleCause(BaseModel):
    cause: str
    probability: float = Field(ge=0.0, le=1.0)
    explanation: str = Field(description="Why this is suspected, citing the observations")
    specialist: Literal["plumbing", "masonry", "waterproofing", "general", "electrical"]


class FollowupQuestion(BaseModel):
    id: str = Field(description="short snake_case id, e.g. 'bathroom_behind'")
    question_en: str
    question_ur: str
    why: str = Field(description="How the answer changes the diagnosis")


class InspectionResult(BaseModel):
    image_usable: bool = Field(description="False if the photo is too blurry/dark or not a home problem")
    issue_category: IssueCategory
    summary_en: str
    summary_ur: str
    observations: list[ObservationItem]
    possible_causes: list[PossibleCause]
    severity: SeverityLevel
    severity_reason: str
    additional_questions: list[FollowupQuestion]
    recommended_next_steps: list[str]
    safety_warnings: list[str] = Field(default_factory=list)
    limitations: list[str]


class SpecialistAssessment(BaseModel):
    specialist: Literal["plumbing", "masonry", "waterproofing", "general", "electrical"]
    supports_cause: str
    reasoning: str = Field(description="Grounded only in observations and homeowner answers")
    agrees: bool


class RepairAction(BaseModel):
    step: str
    trade: Literal["plumber", "mason", "waterproofing", "painter", "electrician", "carpenter", "general"]
    materials: list[str] = Field(default_factory=list)
    estimated_days: float = Field(ge=0, description="Rough working days for this step")
    safety_level: Literal["diy_ok", "professional_recommended", "professional_required"]


class RefinedDiagnosis(BaseModel):
    problem_summary_en: str
    problem_summary_ur: str
    final_cause: str
    final_cause_ur: str
    cause_explanation: str
    confidence: float = Field(ge=0.0, le=1.0)
    confidence_label: Literal["likely", "possible", "uncertain"]
    severity: SeverityLevel
    specialists_consulted: list[SpecialistAssessment]
    conflicts_resolved: str = Field(default="", description="How disagreements between specialists were settled")
    repair_plan: list[RepairAction]
    primary_trade: Literal["plumber", "mason", "waterproofing", "painter", "electrician", "carpenter"]
    safety_warnings: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    professional_inspection_required: bool


class QuoteLineItem(BaseModel):
    description: str
    quantity: float | None = None
    unit: str = ""
    unit_price: float | None = None
    total_price: float | None = Field(default=None, description="null if not legible — never guess")
    category: Literal["labour", "material", "equipment", "transport", "other"]
    unclear: bool = Field(default=False, description="True if any value on this line was hard to read")


class ExtractedQuote(BaseModel):
    is_quotation: bool = Field(description="False if the document is not a quote/estimate/invoice")
    contractor_name: str = ""
    date: str = ""
    work_description: str = ""
    line_items: list[QuoteLineItem]
    labour_total: float | None = None
    material_total: float | None = None
    stated_total: float | None = None
    raw_text: str = ""
    extraction_confidence: float = Field(ge=0.0, le=1.0)
    language_detected: Literal["en", "ur", "mixed"]
    needs_user_review: bool
    review_notes: list[str] = Field(default_factory=list)


class FindingExplanation(BaseModel):
    id: str
    en: str
    ur: str
    roman_ur: str


class AuditExplanation(BaseModel):
    summary_en: str
    summary_ur: str
    summary_roman_ur: str
    finding_explanations: list[FindingExplanation]
    questions_for_contractor_en: list[str]
    questions_for_contractor_ur: list[str]


class FollowupAnswer(BaseModel):
    answer_en: str
    answer_ur: str
    recommended_trade: str = ""
