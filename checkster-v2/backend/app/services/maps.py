"""
Google Maps Platform integration for local service discovery.

CRITICAL RULES:
1. Google AI Studio/Gemini API credentials are SEPARATE from Google Maps Platform credentials.
   We NEVER use GEMINI_API_KEY for Google Maps/Places requests.
2. Uses official Google Maps Platform REST endpoints (Places Text Search / Nearby Search / Place Details).
3. Never scrapes Google Maps or fabricates ratings.
4. Enforces strict status distinction:
   - 'google_maps_listed': Business discovered via Google Maps Platform (external, unverified by Checkster)
   - 'checkster_registered': Contractor who registered an account on Checkster
   - 'checkster_verified': Contractor verified by a Checkster administrator
"""
from __future__ import annotations

import logging
import math
import os
from typing import Any

import httpx

logger = logging.getLogger("checkster.maps")

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()

CITY_COORDS: dict[str, tuple[float, float]] = {
    "peshawar": (34.0151, 71.5249),
    "islamabad": (33.6844, 73.0479),
    "rawalpindi": (33.5651, 73.0169),
    "lahore": (31.5204, 74.3587),
    "karachi": (24.8607, 67.0011),
    "swat": (34.7717, 72.3602),
}

CATEGORY_KEYWORDS: dict[str, str] = {
    "plumber": "plumber plumbing repair",
    "mason": "mason mistri plaster brickwork",
    "electrician": "electrician electrical repair",
    "painter": "house painter painting service",
    "waterproofing": "waterproofing seepage roof leakage repair",
    "general": "general contractor home maintenance",
    "roof": "roof repair waterproofing contractor",
    "carpenter": "carpenter woodwork repair",
}


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return round(2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 2)


async def search_google_places(
    *,
    category: str,
    city: str = "peshawar",
    neighbourhood: str = "",
    latitude: float | None = None,
    longitude: float | None = None,
    radius_m: int = 10000,
) -> dict[str, Any]:
    """
    Query the official Google Maps Places API (Text Search) if GOOGLE_MAPS_API_KEY is configured.
    Never fakes results if the key is absent or invalid.
    """
    if not GOOGLE_MAPS_API_KEY:
        return {
            "maps_configured": False,
            "setup_message": (
                "GOOGLE_MAPS_API_KEY is not configured in backend/.env. "
                "Note: Your Google AI Studio (Gemini) API key is separate from Google Maps Platform credentials. "
                "Enable the Places API in Google Cloud Console and set GOOGLE_MAPS_API_KEY to enable live Google Maps business listings."
            ),
            "places": [],
            "attribution": "Google Maps Platform (not configured)",
        }

    kw = CATEGORY_KEYWORDS.get(category.lower().strip(), category or "home repair contractor")
    loc_str = f"{neighbourhood}, {city}, Pakistan".strip(", ")
    query = f"{kw} in {loc_str}"

    base_lat, base_lng = (
        (latitude, longitude)
        if latitude is not None and longitude is not None
        else CITY_COORDS.get(city.lower().strip(), CITY_COORDS["peshawar"])
    )

    params: dict[str, Any] = {
        "query": query,
        "location": f"{base_lat},{base_lng}",
        "radius": radius_m,
        "key": GOOGLE_MAPS_API_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get("https://maps.googleapis.com/maps/api/place/textsearch/json", params=params)
            data = resp.json()
    except Exception as exc:
        logger.warning("Google Places API call failed: %s", type(exc).__name__)
        return {
            "maps_configured": True,
            "error": "Could not reach Google Places API.",
            "places": [],
            "attribution": "Powered by Google Maps",
        }

    status = data.get("status")
    if status not in ("OK", "ZERO_RESULTS"):
        err_msg = data.get("error_message") or f"Google Places API returned status {status}."
        return {
            "maps_configured": True,
            "error": err_msg,
            "places": [],
            "attribution": "Powered by Google Maps",
        }

    places: list[dict[str, Any]] = []
    for item in data.get("results", [])[:12]:
        loc = item.get("geometry", {}).get("location", {})
        plat, plng = loc.get("lat"), loc.get("lng")
        dist = haversine_km(base_lat, base_lng, plat, plng) if plat is not None and plng is not None else None
        place_id = item.get("place_id", "")
        places.append({
            "id": f"gmaps_{place_id}",
            "google_place_id": place_id,
            "business_name": item.get("name", ""),
            "address": item.get("formatted_address", ""),
            "city": city,
            "neighbourhood": neighbourhood,
            "latitude": plat,
            "longitude": plng,
            "distance_km": dist,
            "rating": item.get("rating"),
            "user_ratings_total": item.get("user_ratings_total", 0),
            "service_categories": [category],
            "listing_status": "google_maps_listed",
            "registration_status": "google_maps_listed",
            "verification_status": "unverified_external",
            "is_external_listing": True,
            "google_maps_url": f"https://www.google.com/maps/place/?q=place_id:{place_id}" if place_id else None,
            "attribution": "Source: Google Maps (External listing — not Checkster-verified)",
        })

    return {
        "maps_configured": True,
        "places": places,
        "center": {"lat": base_lat, "lng": base_lng},
        "attribution": "Listings provided by Google Maps Platform",
    }
