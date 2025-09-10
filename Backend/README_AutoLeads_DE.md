# Auto-Lead-Finder (DE)

Dieses kleine Toolkit hilft dir, **lokale Unternehmen ohne (eigene) Website** zu finden, zu bewerten und als Excel zu exportieren.

## Was es macht
- **Google Places API** (Textsuche + Details): Liest Name, Adresse, Telefon, **Website**-Feld und Bewertungen aus.
- **(Optional) Overpass / OpenStreetMap**: Liefert zusätzliche Firmenlisten für deine Stadt.
- **Heuristik**: Unterscheidet zwischen eigener Website (Y), Social-only/keine Website (N) und leichten Builder-Seiten (L).
- **Scoring**: Priorisiert leichte Chancen (+40 keine Website, +10 Builder, +20 < 20 Reviews, +10 fehlt Maps-URL).

## Setup (5 Minuten)
1. **Python installieren** (3.10+).
2. In einen neuen Ordner wechseln und die Dateien hier hineinlegen.
3. Abhängigkeiten: `pip install -r requirements.txt`
4. `.env.example` zu `.env` kopieren und Werte eintragen (API-Key, Stadt, Keywords).
5. Ausführen: `python lead_auto_pipeline_de.py` → erzeugt `Leads-Auto-Ergebnis.xlsx`.

## Quellen & Fair Use
- **Google Places API**: Für die Website-URL brauchst du **Place Details** (nicht nur Search). Beachte Preise/Quotas.
- **Nominatim/Overpass**: Nutze sparsam, setze **User-Agent**, halte die **Usage Policy** ein.

## Rechtlicher Hinweis (DE)
- **§7 UWG**: Unerwünschte Werbung (insb. E-Mail) kann unzulässig sein. Telefonisch im B2B nur bei zumindest mutmaßlicher Einwilligung.
- Empfehlung: **Telefon/Offline** zuerst, E-Mail nur nach Erlaubnis oder an offizielle Funktionsadressen mit klarer Abmeldung.

## Anpassungen
- `KEYWORDS`: Wähle 1–3 Nischen (z.B. „Bäckerei, Friseur, Klempner“).
- `USE_OVERPASS=true`: Aktiviert OSM-Quelle (mehr Breite, aber unvollständige Felder).
- Scoring-Regeln im Script (`score_row`) anpassen.

## Datenbank & API
- Die Anwendung kann Leads aus der Postgres-DB lesen (`--use-db`) oder aus Excel (Standard).
- Ein leichter API-Server (FastAPI) bietet `/healthz` und `/leads` Endpunkte – optional für Frontend-Integration.
