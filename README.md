# Website Service Monorepo

- Frontend: NextJS dashboard (to be created)
- Backend: Python pipelines for lead generation and offer building
- templates: Shared templates (docx, html, markdown i18n)

## Structure
- Backend/
  - data/: input/output spreadsheets
  - requirements.txt
  - lead_filter_pipeline.py
  - lead_auto_pipeline_de.py
- Frontend/
  - (NextJS goes here later)
- templates/
  - docx/: Word template(s)
  - html/: HTML fragments/templates for summary pages
  - <lang>/ cold_*_template.md: outreach templates (used by backend and frontend)

## Quick start

1. Copy .env.example to .env and fill values.
2. Install backend deps: pip install -r Backend/requirements.txt
3. Run: ./start.sh

## Notes
Do not create the Next.js app yet. This repo is prepared for it.
