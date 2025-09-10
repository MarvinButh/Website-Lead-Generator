# -*- coding: utf-8 -*-
"""
Auto-Lead-Finder (DE) – Lokale Unternehmen ohne Website identifizieren
---------------------------------------------------------------------
Funktionen:
  • Google Places API (Text Search + Place Details) – prüft, ob es eine Website gibt
  • (Optional) OpenStreetMap Overpass – listet Firmen per Kategorie in einem Gebiet
  • Scoring & Export nach Excel (deutsche Spaltenüberschriften)

⚠️ Hinweise:
  • Google Places API: Für "website" brauchst du einen Place Details Call (nicht nur Search).
  • Nominatim/Overpass sparsam und mit User-Agent nutzen (Policy beachten).
  • Recht: Beachte §7 UWG (Werbung), DSGVO und lokale Regeln (z.B. E-Mails ohne Einwilligung).
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
ROOT_DIR = Path(__file__).resolve().parents[1]
load_dotenv(ROOT_DIR / ".env")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()

# === Konfiguration ===
CITY = os.getenv("CITY", "Frankfurt am Main")
COUNTRY_CODE = os.getenv("COUNTRY_CODE", "DE")
# Kommagetrennte Liste von Suchbegriffen, z.B. "Bäckerei, Friseur, Klempner"
KEYWORDS = [s.strip() for s in os.getenv("KEYWORDS", "Bäckerei, Friseur, Klempner").split(",") if s.strip()]

USE_PLACES = os.getenv("USE_PLACES", "true").lower() == "true"
USE_OVERPASS = os.getenv("USE_OVERPASS", "false").lower() == "true"

# Domains, die NICHT als „eigene Website“ zählen
SOCIAL_DOMAINS = {
    "facebook.com", "instagram.com", "twitter.com", "x.com", "tiktok.com",
    "google.com", "g.page", "linktr.ee", "linktree.com", "wa.me", "web.whatsapp.com",
    "yelp.com", "tripadvisor.com", "booking.com"
}
# Häufige Freebuilder-Domains, die ggf. als schwache Präsenz gewertet werden
LIGHT_SITE_DOMAINS = {"wixsite.com", "jimdosite.com", "google.site", "sites.google.com", "webnode.page"}

HEADERS = {"User-Agent": "AutoLeadFinder/1.0 (contact: your-email@example.com)"}

# === Hilfsfunktionen ===
def normalize_phone(p: str) -> str:
    if not p:
        return ""
    return re.sub(r"[^0-9+]", "", p)

def domain_from_url(url: str) -> str:
    if not url:
        return ""
    try:
        ext = tldextract.extract(url)
        if ext.domain and ext.suffix:
            return f"{ext.domain}.{ext.suffix}".lower()
        return url.lower()
    except Exception:
        return url.lower()

def classify_has_website(url: str) -> str:
    """
    Gibt 'Y' (eigene Website), 'L' (leichte/Builder-Seite) oder 'N' (keine/soziale Seite) zurück.
    """
    if not url:
        return "N"
    d = domain_from_url(url)
    if any(d.endswith(sd) for sd in SOCIAL_DOMAINS):
        return "N"
    if any(d.endswith(ld) for ld in LIGHT_SITE_DOMAINS):
        return "L"
    return "Y"

# === Google Places ===
def google_places_textsearch(query: str, next_page_token: str = None):
    base = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {"query": query, "key": GOOGLE_API_KEY, "language": "de"}
    if next_page_token:
        params = {"pagetoken": next_page_token, "key": GOOGLE_API_KEY}
    resp = requests.get(base, params=params, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.json()

def google_place_details(place_id: str):
    # Felder mit Website & Relevanz
    base = "https://maps.googleapis.com/maps/api/place/details/json"
    fields = [
        "name", "formatted_address", "formatted_phone_number", "international_phone_number",
        "website", "url", "user_ratings_total", "opening_hours/weekday_text"
    ]
    params = {"place_id": place_id, "fields": ",".join(fields), "key": GOOGLE_API_KEY, "language": "de"}
    resp = requests.get(base, params=params, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.json()

# === Overpass (optional) ===
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Minimalistische Tag-Mappings
OSM_TAGS = {
    "Bäckerei": [{"shop": "bakery"}],
    "Friseur": [{"shop": "hairdresser"}],
    "Café": [{"amenity": "cafe"}],
    "Restaurant": [{"amenity": "restaurant"}],
    "Klempner": [{"craft": "plumber"}],
    "Elektriker": [{"craft": "electrician"}],
    "Autowerkstatt": [{"shop": "car_repair"}],
}

def overpass_query_bbox(city: str, country_code: str, tags: list):
    """Ermittelt eine grobe Bounding-Box via Nominatim und fragt Overpass ab."""
    bbox = nominatim_bbox(f"{city}, {country_code}")
    if not bbox:
        return []
    south, west, north, east = bbox
    queries = []
    for tag in tags:
        # Tag ist dict mit genau einem key:value
        (k, v), = tag.items()
        # nodes + ways + relations
        queries.append(f'node["{k}"="{v}"]({south},{west},{north},{east});')
        queries.append(f'way["{k}"="{v}"]({south},{west},{north},{east});')
        queries.append(f'relation["{k}"="{v}"]({south},{west},{north},{east});')
    overpass_q = f"""
    [out:json][timeout:60];
    (
      {' '.join(queries)}
    );
    out center tags;
    """
    r = requests.post(OVERPASS_URL, data={"data": overpass_q}, headers=HEADERS, timeout=60)
    r.raise_for_status()
    data = r.json().get("elements", [])
    results = []
    for el in data:
        tags = el.get("tags", {})
        name = tags.get("name")
        if not name:
            continue
        addr_city = tags.get("addr:city", city)
        street = (tags.get("addr:street", "") + " " + tags.get("addr:housenumber", "")).strip()
        postcode = tags.get("addr:postcode", "")
        phone = tags.get("phone") or tags.get("contact:phone") or ""
        website = tags.get("website") or tags.get("contact:website") or ""
        results.append({
            "Firmenname": name,
            "Kategorie": "",
            "Straße": street,
            "Stadt": addr_city,
            "PLZ": postcode,
            "Land": country_code,
            "Telefon": phone,
            "E-Mail": "",
            "GoogleMapsURL": "",
            "Webseite": website,
            "Facebook": "",
            "Instagram": "",
            "GBP_HatWebseite": "",
            "BewertungenAnzahl": None,
            "LetzteBewertungDatum": "",
            "FotosAnzahl": None,
            "HatWebseite": classify_has_website(website),
            "GeprüftAm": str(date.today()),
            "Notizen": "Quelle: OSM/Overpass",
            "Score": None,
            "Status": "Gefunden",
            "NächsteAktionDatum": "",
            "Ansprechpartner": ""
        })
    return results

def nominatim_bbox(query: str):
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": query, "format": "json", "limit": 1}
    r = requests.get(url, params=params, headers=HEADERS, timeout=30)
    r.raise_for_status()
    arr = r.json()
    if not arr:
        return None
    bb = arr[0].get("boundingbox", [])
    if len(bb) == 4:
        south, north, west, east = map(float, bb)
        return (south, west, north, east)
    return None

# === Pipeline ===
def collect_places_for_keyword(keyword: str):
    out = []
    if not GOOGLE_API_KEY:
        print("WARN: GOOGLE_API_KEY fehlt – Places-Suche wird übersprungen.")
        return out
    q = f"{keyword} in {CITY}"
    print(f"[Places] Suche: {q}")
    data = google_places_textsearch(q)
    pages = 0
    while True:
        for item in data.get("results", []):
            name = item.get("name")
            place_id = item.get("place_id")
            maps_url = f"https://maps.google.com/?cid={item.get('place_id','')}"  # Platzhalter
            details = google_place_details(place_id)
            res = details.get("result", {})
            website = res.get("website", "")
            phone = res.get("formatted_phone_number") or res.get("international_phone_number") or ""
            addr = res.get("formatted_address", "")
            reviews = res.get("user_ratings_total", None)

            has = classify_has_website(website)
            out.append({
                "Firmenname": name or "",
                "Kategorie": keyword,
                "Straße": "",  # wird aus Adresse versucht zu splitten
                "Stadt": CITY,
                "PLZ": "",
                "Land": COUNTRY_CODE,
                "Telefon": phone or "",
                "E-Mail": "",
                "GoogleMapsURL": res.get("url", ""),
                "Webseite": website or "",
                "Facebook": "",
                "Instagram": "",
                "GBP_HatWebseite": "Y" if website else "N",
                "BewertungenAnzahl": reviews,
                "LetzteBewertungDatum": "",
                "FotosAnzahl": None,
                "HatWebseite": has,
                "GeprüftAm": str(date.today()),
                "Notizen": f"Quelle: Google Places ({addr})",
                "Score": None,
                "Status": "Gefunden",
                "NächsteAktionDatum": "",
                "Ansprechpartner": ""
            })
        token = data.get("next_page_token")
        if token and pages < 2:  # bis zu ~60 Ergebnisse pro Keyword
            time.sleep(2)  # Places-Anforderung
            data = google_places_textsearch("", next_page_token=token)
            pages += 1
        else:
            break
    return out

def dedupe(rows):
    seen = set()
    out = []
    for r in rows:
        key = (r.get("Firmenname","").strip().lower(), r.get("PLZ","").strip(), normalize_phone(r.get("Telefon","")))
        if key in seen:
            continue
        seen.add(key)
        out.append(r)
    return out

def score_row(r):
    score = 0
    # +40 keine Website
    if r.get("HatWebseite") == "N":
        score += 40
    # +10 Light/Builder-Seite (bessere Zielgruppe für Upgrade)
    if r.get("HatWebseite") == "L":
        score += 10
    # +20 wenige Bewertungen
    try:
        if r.get("BewertungenAnzahl") is not None and int(r.get("BewertungenAnzahl")) < 20:
            score += 20
    except Exception:
        pass
    # +10 fehlende GoogleMapsURL
    if not r.get("GoogleMapsURL"):
        score += 10
    return score

def run_pipeline():
    all_rows = []
    if USE_PLACES:
        for kw in KEYWORDS:
            all_rows.extend(collect_places_for_keyword(kw))
    if USE_OVERPASS:
        for kw in KEYWORDS:
            tags = OSM_TAGS.get(kw, [])
            if not tags:
                continue
            all_rows.extend(overpass_query_bbox(CITY, COUNTRY_CODE, tags))
    # Deduplizieren & Scoring
    all_rows = dedupe(all_rows)
    for r in all_rows:
        r["Score"] = score_row(r)
    # Export
    df = pd.DataFrame(all_rows, columns=[
        "Firmenname","Kategorie","Straße","Stadt","PLZ","Land",
        "Telefon","E-Mail","GoogleMapsURL","Webseite","Facebook","Instagram",
        "GBP_HatWebseite","BewertungenAnzahl","LetzteBewertungDatum","FotosAnzahl",
        "HatWebseite","GeprüftAm","Notizen","Score","Status","NächsteAktionDatum","Ansprechpartner"
    ])
    out_path = str(Path(__file__).resolve().parent / "data" / "Leads-Auto-Ergebnis.xlsx")
    df.to_excel(out_path, index=False)
    print(f"✅ Fertig: {out_path} ({len(df)} Zeilen)")

if __name__ == "__main__":
    run_pipeline()
