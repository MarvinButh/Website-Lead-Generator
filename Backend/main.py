# Vercel expects a top-level entrypoint file for Python serverless functions.
# Export the FastAPI ASGI app so the runtime can find it.
from src.api.main import app as app
