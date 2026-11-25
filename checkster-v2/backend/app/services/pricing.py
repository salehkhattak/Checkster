"""
Pakistan-specific location-aware pricing intelligence + deterministic repair-cost estimator.

Every reference carries:
- item_name, category ('labour' | 'material' | 'equipment' | 'transport' | 'other')
- unit, rate_low, rate_high, location
- source_name, source_url, effective_date, last_verified_at
- source_type ('official' | 'market_observed' | 'sample')

Principles:
1. Daily labour wages are NOT a complete repair-job price.
2. Estimates combine labour requirements (days × trade rate), materials, equipment, and transport/overhead.
3. For Peshawar and KP cities, KP reference rates / PBS national benchmarks are prioritized rather than
   silently applying Punjab-only rates as KP law.
4. Official government rates, market-observed prices, and unverified sample placeholders are strictly distinguished.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Literal

SourceType = Literal["official", "market_observed", "sample"]
Category = Literal["labour", "material", "equipment", "transport", "other"]


@dataclass(frozen=True)
class PriceReference:
    id: str
    category: Category
    item_name: str
    unit: str
    rate_low: float
    rate_high: float
    location: str
    source_name: str
    source_url: str | None
    effective_date: str
    last_verified_at: str
    source_type: SourceType
    trade: str | None = None


PBS_URL = "https://profit.pakistantoday.com.pk/2026/01/04/input-prices-cool-labour-costs-rise-as-construction-activity-shows-mixed-signals/"
PUNJAB_URL = "https://propakistani.pk/2026/07/21/punjab-announces-new-per-day-wages-for-daily-wage-workers/"
PBS_SPI_URL = "https://www.pbs.gov.pk/content/sensitive-price-indicator-spi"

PRICE_REFERENCES: list[PriceReference] = [
    # 1. Official Labour Rates
    PriceReference(
        "lab-mason-pbs", "labour", "Mason (raj mistri) daily wage", "day",
        1987, 1987, "Pakistan (national avg)",
        "Pakistan Bureau of Statistics (SPI), national average", PBS_URL,
        "2026-01", "2026-01-04", "official", "mason",
    ),
    PriceReference(
        "lab-plumber-pbs", "labour", "Plumber daily wage", "day",
        1754, 1754, "Pakistan (national avg)",
        "Pakistan Bureau of Statistics (SPI), national average", PBS_URL,
        "2026-01", "2026-01-04", "official", "plumber",
    ),
    PriceReference(
        "lab-painter-pbs", "labour", "Painter daily wage", "day",
        1709, 1709, "Pakistan (national avg)",
        "Pakistan Bureau of Statistics (SPI), national average", PBS_URL,
        "2026-01", "2026-01-04", "official", "painter",
    ),
    PriceReference(
        "lab-electrician-pbs", "labour", "Electrician per-point rate", "point",
        279, 279, "Pakistan (national avg)",
        "Pakistan Bureau of Statistics (SPI), national average", PBS_URL,
        "2026-01", "2026-01-04", "official", "electrician",
    ),
    PriceReference(
        "lab-skilled-punjab", "labour", "Skilled worker (govt. works)", "day",
        2000, 2000, "Punjab",
        "Finance Department Punjab, daily wage notification", PUNJAB_URL,
        "2026-07", "2026-07-21", "official", "skilled",
    ),
    # 2. Market-Observed & Sample Material Rates (explicitly tagged)
    PriceReference(
        "mat-cement-bag", "material", "Portland Cement (50 kg bag, Grade 53)", "bag",
        1350, 1480, "Pakistan (PBS SPI tracked item)",
        "PBS Weekly SPI / documented market range", PBS_SPI_URL,
        "2026-01", "2026-01-15", "market_observed",
    ),
    PriceReference(
        "mat-plaster", "material", "Cement-sand plaster materials (1:4 mix)", "sq ft",
        40, 70, "Pakistan",
        "Sample material estimate — not an official schedule rate", None,
        "2026", "—", "sample",
    ),
    PriceReference(
        "mat-paint", "material", "Acrylic primer, wall putty & 2 coats emulsion paint", "sq ft",
        35, 60, "Pakistan",
        "Sample material estimate — not an official schedule rate", None,
        "2026", "—", "sample",
    ),
    PriceReference(
        "mat-waterproof", "material", "Cementitious / acrylic waterproofing coating (2 coats)", "sq ft",
        60, 140, "Pakistan",
        "Sample material estimate — varies by brand (Sika/Ultra/MasterSeal)", None,
        "2026", "—", "sample",
    ),
    PriceReference(
        "mat-pipe-fittings", "material", "PPRC pipe fittings, joint sleeves & thread sealant", "job",
        1000, 3500, "Pakistan",
        "Sample material estimate — depends on hidden pipe diameter", None,
        "2026", "—", "sample",
    ),
    # 3. Equipment & Testing Costs
    PriceReference(
        "eq-pressure-test", "equipment", "Plumbing line pressure-test pump & gauge check", "test",
        800, 1500, "Pakistan",
        "Market-observed diagnostic test charge", None,
        "2026", "—", "market_observed",
    ),
    # 4. Transport & Debris Removal
    PriceReference(
        "tr-material-fetch", "transport", "Local material delivery & rubble disposal (small repair)", "trip",
        500, 1200, "Pakistan",
        "Sample local transport allowance", None,
        "2026", "—", "sample",
    ),
]

KP_CITIES = {"peshawar", "swat", "mardan", "abbottabad", "kohat", "nowshera", "charsadda", "haripur"}
PUNJAB_CITIES = {"lahore", "rawalpindi", "faisalabad", "multan", "gujranwala", "sialkot"}


def references(category: str | None = None, location: str | None = None) -> list[dict]:
    items = [asdict(r) for r in PRICE_REFERENCES if category is None or r.category == category]
    if location:
        loc = location.lower().strip()
        if loc in KP_CITIES:
            items = [i for i in items if i["location"] != "Punjab" or i["id"] == "lab-skilled-punjab"]
    return items


def labour_day_range(trade: str, city: str = "") -> tuple[float, float, list[str], str]:
    """Return (low, high, reference_ids, note) for one worker-day of a trade."""
    pbs = next((r for r in PRICE_REFERENCES if r.trade == trade and r.id.endswith("-pbs") and r.unit == "day"), None)
    punjab = next(r for r in PRICE_REFERENCES if r.id == "lab-skilled-punjab")
    c = city.lower().strip()
    if c in KP_CITIES:
        note = (
            f"Location: {city.title()} (KP). Using PBS national average (Rs {pbs.rate_low if pbs else 1987:,.0f}/day) "
            "as primary official benchmark; KP C&W MRS item schedules should be consulted for public tenders. "
            "Punjab skilled rate (Rs 2,000/day) is shown only as an upper provincial reference."
        )
    elif c in PUNJAB_CITIES:
        note = "Location: Punjab. Finance Dept. Punjab government skilled-worker rate (Rs 2,000/day) and PBS national average apply."
    else:
        note = "PBS national average (Jan 2026) with Finance Dept. Punjab skilled rate (Rs 2,000/day) as upper reference."
    low = pbs.rate_low if pbs else punjab.rate_low
    ids = [x.id for x in (pbs, punjab) if x]
    return min(low, punjab.rate_low), max(low, punjab.rate_high), ids, note


def estimate_repair_cost(repair_plan: list[dict], area_sqft: float, city: str = "") -> dict:
    """
    Deterministic estimate from a repair plan (trade + estimated_days per step),
    plus area-based materials, equipment, and transport.
    """
    area = max(10.0, float(area_sqft or 40))
    rows: list[dict] = []
    notes: set[str] = set()

    for step in repair_plan:
        trade = step.get("trade", "general")
        days = max(0.5, float(step.get("estimated_days") or 1))
        lookup = {"waterproofing": "mason", "general": "mason", "carpenter": "mason", "electrician": "mason"}.get(trade, trade)
        lo, hi, ids, note = labour_day_range(lookup, city)
        notes.add(note)
        rows.append({
            "work": f"{step.get('step', trade)} — labour ({trade}, ~{days:g} day{'s' if days != 1 else ''})",
            "low": round(lo * days),
            "high": round(hi * max(days, 1) * 1.5),
            "kind": "labour",
            "source_type": "official",
            "reference_ids": ids,
        })

    has = lambda t: any(s.get("trade") == t for s in repair_plan)  # noqa: E731
    mats: list[tuple[str, float]] = []
    if has("plumber"):
        mats.append(("eq-pressure-test", 1))
        mats.append(("mat-pipe-fittings", 1))
    if has("waterproofing"):
        mats.append(("mat-waterproof", area))
    if has("mason") or not repair_plan:
        mats.append(("mat-plaster", area))
    if has("painter") or not repair_plan:
        mats.append(("mat-paint", area))
    mats.append(("tr-material-fetch", 1))

    for rid, qty in mats:
        ref = next(r for r in PRICE_REFERENCES if r.id == rid)
        unit_desc = f"~{qty:g} {ref.unit}" if ref.unit not in ("job", "test", "trip") else f"per {ref.unit}"
        rows.append({
            "work": f"{ref.item_name} ({unit_desc})",
            "low": round(ref.rate_low * qty),
            "high": round(ref.rate_high * qty),
            "kind": ref.category,
            "source_type": ref.source_type,
            "reference_ids": [rid],
        })

    return {
        "rows": rows,
        "total_low": sum(r["low"] for r in rows),
        "total_high": sum(r["high"] for r in rows),
        "area_sqft": area,
        "city": city or "peshawar",
        "notes": sorted(notes) + [
            "Official rates cover daily labour wages only; material and transport rows are marked as market-observed or sample estimates.",
            "This is an estimated project cost range, not an official government bill of quantities or a binding contractor quote.",
        ],
    }
