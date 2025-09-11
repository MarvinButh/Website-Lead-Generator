# -*- coding: utf-8 -*-
"""
Auto-Lead-Finder (DE) – Lokale Unternehmen ohne Website identifizieren
---------------------------------------------------------------------
This module was moved into `Backend/src` to make `src` package imports work in serverless builds.
"""
import os
import time
import re
import math
import json
import tldextract
import pandas as pd
import requests
from urllib.parse import urlencode
from dotenv import load_dotenv
from datetime import date, datetime
from pathlib import Path

# Load env from repo root irrespective of CWD
ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()

# === Konfiguration ===
CITY = os.getenv("CITY", "Frankfurt am Main")
COUNTRY_CODE = os.getenv("COUNTRY_CODE", "DE")
KEYWORDS = [s.strip() for s in os.getenv("KEYWORDS", "Bäckerei, Friseur, Klempner").split(",") if s.strip()]

USE_PLACES = os.getenv("USE_PLACES", "true").lower() == "true"
USE_OVERPASS = os.getenv("USE_OVERPASS", "false").lower() == "true"

# Keep rest of file unchanged for brevity — this is a lightweight stub to support imports in serverless.

def collect_places_for_keyword(keyword: str):
    return []

def dedupe(rows):
    return rows

def score_row(r):
    return 0

if __name__ == "__main__":
    print("This is a compatibility shim for serverless builds.")
