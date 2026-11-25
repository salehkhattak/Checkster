"""List Gemini models available to the configured API key (never prints the key).

Usage:  python scripts/list_models.py
"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from google import genai

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

key = os.getenv("GEMINI_API_KEY", "").strip()
if not key:
    sys.exit("GEMINI_API_KEY is not set in backend/.env")

client = genai.Client(api_key=key)
configured = os.getenv("GEMINI_MODEL", "").strip()
names = []
for m in client.models.list():
    actions = getattr(m, "supported_actions", None) or []
    if "generateContent" in actions:
        names.append(m.name.replace("models/", ""))

for n in sorted(names):
    print(n)
print("---")
print(f"Configured GEMINI_MODEL: {configured!r} -> {'AVAILABLE' if configured in names else 'NOT AVAILABLE'}")
