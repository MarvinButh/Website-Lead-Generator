This directory holds templates used by the Backend pipelines (DOCX, markdown, HTML).
It was moved from the repository root's `templates/` to `Backend/templates/` to ensure the Vercel serverless backend includes them in the function bundle.

Note: The pipeline code reads templates from the following order:
- directory specified by the TEMPLATES_DIR environment variable
- /templates (Docker volume)
- Backend/templates/ (this directory)

If you need to override, set TEMPLATES_DIR to an absolute path accessible at runtime.
