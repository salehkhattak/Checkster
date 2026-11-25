"""
Private storage service with HMAC-signed URLs.

Uploaded photographs and quotation documents are stored outside any public static root
and are served only through short-lived HMAC-signed URLs (/api/files/{file_id}?expires=...&sig=...).
"""
from __future__ import annotations

import hashlib
import hmac
import os
import time
from pathlib import Path

from fastapi import HTTPException

from app.database import DATA_DIR, new_id
from app.services.auth import AUTH_SECRET

PRIVATE_DIR = DATA_DIR / "private_uploads"
PRIVATE_DIR.mkdir(parents=True, exist_ok=True)

EXT_TO_MIME = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
}
MIME_TO_EXT = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
}


def store_private_file(data: bytes, mime_type: str, prefix: str = "file") -> str:
    ext = MIME_TO_EXT.get(mime_type, ".bin")
    file_id = f"{new_id(prefix)}{ext}"
    target = (PRIVATE_DIR / file_id).resolve()
    if PRIVATE_DIR.resolve() not in target.parents:
        raise HTTPException(400, "Invalid file identifier.")
    target.write_bytes(data)
    return file_id


def delete_private_file(file_id: str) -> bool:
    name = Path(file_id).name
    target = (PRIVATE_DIR / name).resolve()
    if PRIVATE_DIR.resolve() in target.parents and target.exists():
        target.unlink()
        return True
    return False


def sign_file_url(file_id: str, ttl_seconds: int = 3600) -> str:
    name = Path(file_id).name
    expires = int(time.time()) + ttl_seconds
    msg = f"{name}:{expires}".encode("utf-8")
    sig = hmac.new(AUTH_SECRET.encode("utf-8"), msg, hashlib.sha256).hexdigest()
    return f"/api/files/{name}?expires={expires}&sig={sig}"


def verify_and_read_file(file_id: str, expires: int, sig: str) -> tuple[bytes, str]:
    name = Path(file_id).name
    if expires < int(time.time()):
        raise HTTPException(403, "Signed URL has expired.")
    msg = f"{name}:{expires}".encode("utf-8")
    expected = hmac.new(AUTH_SECRET.encode("utf-8"), msg, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, sig):
        raise HTTPException(403, "Invalid signed URL signature.")
    target = (PRIVATE_DIR / name).resolve()
    if PRIVATE_DIR.resolve() not in target.parents or not target.exists():
        raise HTTPException(404, "File not found.")
    mime = EXT_TO_MIME.get(target.suffix.lower(), "application/octet-stream")
    return target.read_bytes(), mime
