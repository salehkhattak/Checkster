"""
Checkster persistent database layer (SQLite locally + Supabase PostgreSQL compatible).

Implements the normalized schema across:
- users
- inspections
- inspection_evidence
- inspection_recommendations
- quotations
- quotation_line_items
- contractors
- contractor_reviews
- saved_contractors
- repair_requests
- price_references
"""
from __future__ import annotations

import json
import os
import sqlite3
import time
import uuid
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

DATA_DIR = Path(os.getenv("CHECKSTER_DATA_DIR", Path(__file__).resolve().parents[1] / "data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = Path(os.getenv("CHECKSTER_DB_PATH", DATA_DIR / "checkster.db"))


def new_id(prefix: str = "") -> str:
    uid = uuid.uuid4().hex[:16]
    return f"{prefix}_{uid}" if prefix else uid


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


SCHEMA_SQL = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone TEXT DEFAULT '',
    role TEXT NOT NULL CHECK (role IN ('homeowner', 'contractor', 'admin')) DEFAULT 'homeowner',
    preferred_language TEXT NOT NULL CHECK (preferred_language IN ('en', 'ur', 'roman_ur')) DEFAULT 'en',
    city TEXT DEFAULT 'peshawar',
    neighbourhood TEXT DEFAULT '',
    reset_token TEXT DEFAULT NULL,
    reset_expires INTEGER DEFAULT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS inspections (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    property_location TEXT DEFAULT '',
    city TEXT DEFAULT 'peshawar',
    neighbourhood TEXT DEFAULT '',
    room TEXT DEFAULT 'bedroom',
    area_sqft REAL DEFAULT 40,
    issue_category TEXT NOT NULL,
    description TEXT DEFAULT '',
    image_urls TEXT NOT NULL DEFAULT '[]',
    initial_analysis_json TEXT DEFAULT '{}',
    followup_answers_json TEXT DEFAULT '{}',
    diagnosis_json TEXT DEFAULT '{}',
    estimate_json TEXT DEFAULT '{}',
    diagnosis TEXT DEFAULT '',
    severity TEXT DEFAULT 'moderate',
    confidence REAL DEFAULT 0.0,
    status TEXT NOT NULL CHECK (status IN (
        'draft', 'submitted', 'analysing', 'awaiting_answers',
        'diagnosis_ready', 'quote_uploaded', 'quote_audited',
        'repair_requested', 'completed'
    )) DEFAULT 'draft',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inspections_user ON inspections(user_id);

CREATE TABLE IF NOT EXISTS inspection_evidence (
    id TEXT PRIMARY KEY,
    inspection_id TEXT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    observation TEXT NOT NULL,
    image_reference TEXT DEFAULT '',
    evidence_type TEXT DEFAULT 'visual',
    confidence REAL DEFAULT 0.0
);
CREATE INDEX IF NOT EXISTS idx_evidence_inspection ON inspection_evidence(inspection_id);

CREATE TABLE IF NOT EXISTS inspection_recommendations (
    id TEXT PRIMARY KEY,
    inspection_id TEXT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    repair_action TEXT NOT NULL,
    trade TEXT DEFAULT 'general',
    materials TEXT DEFAULT '[]',
    estimated_cost REAL DEFAULT 0,
    safety_level TEXT DEFAULT 'professional_recommended',
    explanation TEXT DEFAULT '',
    step_order INTEGER DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_rec_inspection ON inspection_recommendations(inspection_id);

CREATE TABLE IF NOT EXISTS quotations (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    inspection_id TEXT REFERENCES inspections(id) ON DELETE SET NULL,
    contractor_name TEXT DEFAULT '',
    quote_date TEXT DEFAULT '',
    uploaded_file_url TEXT DEFAULT '',
    extracted_text TEXT DEFAULT '',
    quoted_total REAL DEFAULT NULL,
    audited_total REAL DEFAULT 0,
    audit_status TEXT NOT NULL DEFAULT 'extracted',
    findings_json TEXT DEFAULT '[]',
    ai_explanation_json TEXT DEFAULT '{}',
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_quotations_user ON quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_inspection ON quotations(inspection_id);

CREATE TABLE IF NOT EXISTS quotation_line_items (
    id TEXT PRIMARY KEY,
    quotation_id TEXT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity REAL DEFAULT NULL,
    unit TEXT DEFAULT '',
    unit_price REAL DEFAULT NULL,
    total_price REAL DEFAULT NULL,
    normalized_category TEXT DEFAULT 'other',
    reference_price REAL DEFAULT NULL,
    variance REAL DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_qitems_quotation ON quotation_line_items(quotation_id);

CREATE TABLE IF NOT EXISTS contractors (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    owner_name TEXT DEFAULT '',
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    service_categories TEXT NOT NULL DEFAULT '[]',
    experience_years INTEGER DEFAULT 1,
    daily_rate REAL DEFAULT 2000,
    description TEXT DEFAULT '',
    city TEXT NOT NULL DEFAULT 'peshawar',
    neighbourhood TEXT DEFAULT '',
    working_areas TEXT DEFAULT '[]',
    address TEXT DEFAULT '',
    latitude REAL DEFAULT NULL,
    longitude REAL DEFAULT NULL,
    google_place_id TEXT DEFAULT NULL,
    profile_photo_url TEXT DEFAULT '',
    past_work_urls TEXT DEFAULT '[]',
    verification_doc_url TEXT DEFAULT '',
    verification_notes TEXT DEFAULT '',
    is_available INTEGER DEFAULT 1,
    registration_status TEXT NOT NULL CHECK (registration_status IN (
        'google_maps_listed', 'checkster_registered'
    )) DEFAULT 'checkster_registered',
    verification_status TEXT NOT NULL CHECK (verification_status IN (
        'pending', 'submitted', 'under_review', 'verified', 'rejected'
    )) DEFAULT 'pending',
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contractors_city ON contractors(city);
CREATE INDEX IF NOT EXISTS idx_contractors_user ON contractors(user_id);

CREATE TABLE IF NOT EXISTS contractor_reviews (
    id TEXT PRIMARY KEY,
    contractor_id TEXT NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name TEXT DEFAULT '',
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review TEXT DEFAULT '',
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviews_contractor ON contractor_reviews(contractor_id);

CREATE TABLE IF NOT EXISTS saved_contractors (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contractor_id TEXT DEFAULT NULL,
    google_place_id TEXT DEFAULT NULL,
    snapshot_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_contractors(user_id);

CREATE TABLE IF NOT EXISTS repair_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    inspection_id TEXT REFERENCES inspections(id) ON DELETE SET NULL,
    contractor_id TEXT REFERENCES contractors(id) ON DELETE SET NULL,
    trade TEXT NOT NULL DEFAULT 'plumber',
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    city TEXT DEFAULT 'peshawar',
    neighbourhood TEXT DEFAULT '',
    offered_price REAL NOT NULL DEFAULT 0,
    counter_price REAL DEFAULT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'open', 'accepted', 'countered', 'rejected', 'scheduled', 'completed', 'cancelled'
    )) DEFAULT 'open',
    scheduled_date TEXT DEFAULT '',
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_requests_user ON repair_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_contractor ON repair_requests(contractor_id);

CREATE TABLE IF NOT EXISTS price_references (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('labour', 'material', 'equipment', 'transport', 'other')),
    item_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    location TEXT NOT NULL,
    rate REAL NOT NULL,
    rate_high REAL NOT NULL,
    source_name TEXT NOT NULL,
    source_url TEXT DEFAULT NULL,
    effective_date TEXT NOT NULL,
    last_verified_at TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('official', 'market_observed', 'sample'))
);
CREATE INDEX IF NOT EXISTS idx_prices_category ON price_references(category, location);
"""


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), timeout=15.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


@contextmanager
def db_cursor(commit: bool = True) -> Iterator[sqlite3.Cursor]:
    conn = get_connection()
    try:
        cur = conn.cursor()
        yield cur
        if commit:
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def row_to_dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return dict(row)


def parse_json_field(val: Any, default: Any) -> Any:
    if isinstance(val, (dict, list)):
        return val
    if not val:
        return default
    try:
        return json.loads(val)
    except Exception:
        return default


def init_db() -> None:
    with db_cursor(commit=True) as cur:
        cur.executescript(SCHEMA_SQL)
    _seed_price_references()


def _seed_price_references() -> None:
    from app.services.pricing import PRICE_REFERENCES  # noqa: PLC0415

    with db_cursor(commit=True) as cur:
        for ref in PRICE_REFERENCES:
            cur.execute(
                """
                INSERT OR REPLACE INTO price_references (
                    id, category, item_name, unit, location, rate, rate_high,
                    source_name, source_url, effective_date, last_verified_at, source_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    ref.id,
                    ref.category,
                    ref.item_name,
                    ref.unit,
                    ref.location,
                    ref.rate_low,
                    ref.rate_high,
                    ref.source_name,
                    ref.source_url,
                    ref.effective_date,
                    ref.last_verified_at,
                    ref.source_type,
                ),
            )
