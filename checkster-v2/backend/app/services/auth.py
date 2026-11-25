"""
Checkster authentication and authorization service.

- PBKDF2-HMAC-SHA256 password hashing with 200,000 iterations and random 16-byte salt.
- HMAC-SHA256 signed session tokens (stateless JWT-like token) + DB user lookup.
- Supports roles: 'homeowner', 'contractor', 'admin'.
- Supports Supabase JWT verification when SUPABASE_JWT_SECRET is configured.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.database import db_cursor, new_id, now_iso, row_to_dict

AUTH_SECRET = os.getenv("CHECKSTER_AUTH_SECRET", "checkster-local-dev-secret-change-in-prod-2026")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 200_000)
    return f"pbkdf2_sha256$200000${salt}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, iters_s, salt, digest = stored.split("$", 3)
        if algo != "pbkdf2_sha256":
            return False
        dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), int(iters_s))
        return hmac.compare_digest(dk.hex(), digest)
    except Exception:
        return False


def _b64u_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64u_decode(s: str) -> bytes:
    pad = "=" * ((4 - len(s) % 4) % 4)
    return base64.urlsafe_b64decode((s + pad).encode("ascii"))


def create_access_token(user_id: str, role: str, email: str) -> str:
    header = _b64u_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode("utf-8"))
    payload_data = {
        "sub": user_id,
        "role": role,
        "email": email,
        "iat": int(time.time()),
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    payload = _b64u_encode(json.dumps(payload_data).encode("utf-8"))
    signing_input = f"{header}.{payload}".encode("ascii")
    sig = _b64u_encode(hmac.new(AUTH_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest())
    return f"{header}.{payload}.{sig}"


def decode_access_token(token: str) -> dict[str, Any]:
    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(401, "Invalid authentication token.")
    header_b64, payload_b64, sig_b64 = parts
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    secrets_to_try = [AUTH_SECRET] + ([SUPABASE_JWT_SECRET] if SUPABASE_JWT_SECRET else [])
    verified = False
    for sec in secrets_to_try:
        expected = _b64u_encode(hmac.new(sec.encode("utf-8"), signing_input, hashlib.sha256).digest())
        if hmac.compare_digest(expected, sig_b64):
            verified = True
            break
    if not verified:
        raise HTTPException(401, "Invalid or expired session token.")
    try:
        payload = json.loads(_b64u_decode(payload_b64).decode("utf-8"))
    except Exception as exc:
        raise HTTPException(401, "Malformed session token.") from exc
    if int(payload.get("exp", 0)) < int(time.time()):
        raise HTTPException(401, "Session expired. Please log in again.")
    return payload


def sanitize_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "phone": user.get("phone", ""),
        "role": user["role"],
        "preferred_language": user.get("preferred_language", "en"),
        "city": user.get("city", "peshawar"),
        "neighbourhood": user.get("neighbourhood", ""),
        "created_at": user["created_at"],
    }


def get_user_by_id(user_id: str) -> dict[str, Any] | None:
    with db_cursor(commit=False) as cur:
        cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        return row_to_dict(cur.fetchone())


def get_user_by_email(email: str) -> dict[str, Any] | None:
    with db_cursor(commit=False) as cur:
        cur.execute("SELECT * FROM users WHERE lower(email) = lower(?)", (email.strip(),))
        return row_to_dict(cur.fetchone())


def register_user(
    *,
    name: str,
    email: str,
    password: str,
    phone: str = "",
    city: str = "peshawar",
    neighbourhood: str = "",
    preferred_language: str = "en",
    role: str = "homeowner",
) -> dict[str, Any]:
    clean_email = email.strip().lower()
    if "@" not in clean_email or len(clean_email) < 5:
        raise HTTPException(400, "Please provide a valid email address.")
    if len(password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")
    if len(name.strip()) < 2:
        raise HTTPException(400, "Please enter your full name.")
    if role not in ("homeowner", "contractor", "admin"):
        role = "homeowner"
    if preferred_language not in ("en", "ur", "roman_ur"):
        preferred_language = "en"

    if get_user_by_email(clean_email):
        raise HTTPException(409, "An account with this email already exists. Please log in.")

    uid = new_id("usr")
    pw_hash = hash_password(password)
    created = now_iso()
    with db_cursor(commit=True) as cur:
        cur.execute(
            """
            INSERT INTO users (id, name, email, password_hash, phone, role, preferred_language, city, neighbourhood, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (uid, name.strip(), clean_email, pw_hash, phone.strip(), role, preferred_language, city.strip().lower(), neighbourhood.strip(), created),
        )
    user = get_user_by_id(uid)
    assert user is not None
    return sanitize_user(user)


def authenticate_user(email: str, password: str) -> tuple[dict[str, Any], str]:
    user = get_user_by_email(email)
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(401, "Incorrect email or password.")
    clean = sanitize_user(user)
    token = create_access_token(clean["id"], clean["role"], clean["email"])
    return clean, token


def create_password_reset(email: str) -> str | None:
    user = get_user_by_email(email)
    if not user:
        return None
    token = secrets.token_urlsafe(24)
    expires = int(time.time()) + 1800
    with db_cursor(commit=True) as cur:
        cur.execute("UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?", (token, expires, user["id"]))
    return token


def reset_password_with_token(token: str, new_password: str) -> bool:
    if len(new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")
    with db_cursor(commit=True) as cur:
        cur.execute("SELECT id, reset_expires FROM users WHERE reset_token = ?", (token.strip(),))
        row = row_to_dict(cur.fetchone())
        if not row or int(row.get("reset_expires") or 0) < int(time.time()):
            raise HTTPException(400, "Invalid or expired reset token.")
        cur.execute(
            "UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?",
            (hash_password(new_password), row["id"]),
        )
    return True


async def get_optional_user(
    request: Request,
    creds: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, Any] | None:
    token = creds.credentials if creds else request.query_params.get("token")
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user = get_user_by_id(str(payload.get("sub", "")))
        return sanitize_user(user) if user else None
    except HTTPException:
        return None


async def get_current_user(
    user: dict[str, Any] | None = Depends(get_optional_user),
) -> dict[str, Any]:
    if not user:
        raise HTTPException(401, "Authentication required. Please log in.")
    return user


async def require_admin(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(403, "Administrator access required.")
    return user
