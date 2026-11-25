"""Upload validation + document text extraction (no network)."""
from __future__ import annotations

import io
import logging
import os

from PIL import Image, ImageOps

logger = logging.getLogger("checkster.ocr")
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "10"))
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}


class UploadError(ValueError):
    pass


def check_size(data: bytes) -> None:
    if not data:
        raise UploadError("The uploaded file is empty.")
    if len(data) > MAX_UPLOAD_MB * 1024 * 1024:
        raise UploadError(f"File is too large. Maximum size is {MAX_UPLOAD_MB} MB.")


def is_pdf(data: bytes) -> bool:
    return data[:5] == b"%PDF-"


def sanitize_image(data: bytes, max_side: int = 2048) -> tuple[bytes, str]:
    """
    Validate by decoding the actual bytes (not the client-sent MIME type),
    strip EXIF metadata (incl. GPS location), downscale large photos and
    re-encode as JPEG. Returns (bytes, mime_type).
    """
    check_size(data)
    try:
        img = Image.open(io.BytesIO(data))
        fmt = (img.format or "").upper()
        if fmt not in ALLOWED_IMAGE_FORMATS:
            raise UploadError(f"Unsupported image type ({fmt or 'unknown'}). Please upload JPG, PNG or WEBP.")
        img = ImageOps.exif_transpose(img)  # keep orientation, then drop metadata
        img = img.convert("RGB")
        img.thumbnail((max_side, max_side))
        out = io.BytesIO()
        img.save(out, format="JPEG", quality=88)
        return out.getvalue(), "image/jpeg"
    except UploadError:
        raise
    except Exception as exc:  # noqa: BLE001
        raise UploadError("Could not read this image. Please upload a JPG, PNG or WEBP photo.") from exc


def extract_text_from_pdf(pdf_bytes: bytes, max_pages: int = 10) -> str:
    """Text layer of a digital PDF. Empty string for scanned/image-only PDFs."""
    try:
        import PyPDF2  # noqa: PLC0415

        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        if reader.is_encrypted:
            raise UploadError("This PDF is password-protected. Please upload an unlocked copy or a photo.")
        return "\n".join((p.extract_text() or "") for p in reader.pages[:max_pages]).strip()
    except UploadError:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.warning("PDF text extraction failed: %s", type(exc).__name__)
        return ""
