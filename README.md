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

---

## Deploy to Vercel

This repo is set up to deploy the Next.js app and a Python FastAPI backend on Vercel.

- Frontend: `Frontend/website-lead-dashboard` (Next.js). It proxies requests from `/api/backend/*` to the backend.
- Backend: `Backend/api/index.py` exposes the FastAPI ASGI app as a Vercel Python Function.

Files added/updated for Vercel:
- Proxy route: `Frontend/website-lead-dashboard/src/app/api/backend/[...path]/route.ts`.
- Backend ASGI entry: `Backend/api/index.py`.
- `Frontend/website-lead-dashboard/vercel.json`: function sizing for the proxy route (optional; you can also configure limits in Vercel UI).
- [Optional, monorepo single-project only] `vercel.json` at repo root to build both apps in one project.

Important notes:
- Serverless filesystem is read-only. The backend writes generated assets to `/tmp/offer-sheets` on Vercel by default. You can override with `OFFERS_DIR`.
- If the DOCX template file is not present at deploy time, set `DOCX_TEMPLATE_URL` to a reachable URL; the backend will download it into `/tmp` on-demand.

### Environment variables (set in Vercel Project Settings)

Shared:
- KEYWORDS, CITY, COUNTRY_CODE, USE_PLACES, USE_OVERPASS, TEMPLATE_LANG
- Outreach defaults: YOUR_NAME, YOUR_TITLE, YOUR_COMPANY, YOUR_EMAIL, YOUR_PHONE, YOUR_WEBSITE, CALENDAR_LINK, PROJECT_LINK, SHORT_OUTCOME, DEFAULT_PRICE, DEFAULT_PAGES, DEFAULT_TIMELINE, SUPPORT_PERIOD

Backend:
- DATABASE_URL (recommended) or DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- FRONTEND_ORIGIN (e.g. your Next.js domain)
- OFFERS_DIR (optional; defaults to /tmp/offer-sheets on Vercel)
- TEMPLATES_DIR (optional; defaults to repo `templates`)
- DOCX_TEMPLATE_URL (optional; public URL to the .docx template)

Frontend:
- NEXT_PUBLIC_API_BASE=/api/backend
- API_INTERNAL_BASE: full URL of backend function if split across projects (e.g. https://your-backend.vercel.app)

### How to deploy

Option A: Single Vercel project (monorepo)
1. Import this repo in Vercel.
2. Add a `vercel.json` at repo root (optional config example in repo history).
3. Set env vars above in Project Settings.
4. Deploy. The frontend will be the default site; the backend is available via the proxy at `/api/backend/*`.

Option B: Two Vercel projects (one for frontend, one for backend)
1. Create a separate Vercel project pointing to `Backend/` and another to `Frontend/website-lead-dashboard/`.
2. In the frontend project, set `API_INTERNAL_BASE` to the deployed backend URL.
3. Set the same shared env vars in both projects (DB, outreach, etc.).

### Database
Use a managed Postgres (e.g. Neon, Supabase, RDS). Set `DATABASE_URL` in the backend project. The backend will fall back to SQLite if not reachable, which is not persistent on Vercel.

### Testing after deploy
- Visit `/help` to view settings.
- Generate leads from the dashboard; verify `/api/backend/leads/generate` works.
- Open a lead slug page and ensure the summary loads via `/api/backend/assets/{slug}/summary`.
