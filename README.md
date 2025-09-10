# Website Service Monorepo

This monorepo contains:
- Backend (Python): lead pipelines and offer generation + FastAPI server
- Frontend (Next.js): lead dashboard
- Templates: shared docx, html, and localized markdown

## Quick start (Docker)

1. Copy `.env.example` to `.env` and adjust values.
2. Build and start services:
   - docker compose up --build
3. Services:
   - Postgres on localhost:5432
   - Backend API on http://localhost:8000 (FastAPI)
   - Frontend on http://localhost:3000

Import existing Excel leads into the DB:
- docker compose run --rm backend bash -lc "python -c 'from src.db.models.lead import Base; from src.db.engine import engine; Base.metadata.create_all(engine)' && python /scripts/migrate_from_files.py"

Generate offers locally from DB (inside backend container):
- docker compose run --rm backend bash -lc "python lead_filter_pipeline.py --use-db -t /templates/docx/Angebot-Webseitenservice.docx -o /app/offer-sheets -v"

## Local dev (without Docker)
- Python backend
  - pip install -r Backend/requirements.txt
  - export PYTHONPATH=$PWD/Backend
  - export DATABASE_URL=postgresql+psycopg2://USER:PASS@HOST:PORT/DB
  - uvicorn src.api.main:app --reload
  - python Backend/lead_filter_pipeline.py --use-db
- Frontend
  - cd Frontend/website-lead-dashboard && pnpm install && pnpm dev

## Structure
- Backend/
  - data/: input/output spreadsheets
  - requirements.txt
  - lead_filter_pipeline.py
  - lead_auto_pipeline_de.py
  - src/api/main.py (FastAPI)
- Frontend/
  - website-lead-dashboard: Next.js app
- templates/
  - docx/: Word template(s)
  - html/: HTML fragments/templates for summary pages
  - <lang>/ cold_*_template.md: outreach templates (used by backend and frontend)

## Notes
You can switch pipeline to DB with `--use-db` (default Excel).

## Endpoints
- GET /healthz
- GET /leads
