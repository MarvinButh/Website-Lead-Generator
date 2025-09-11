# Vercel Python Function entrypoint exposing the FastAPI ASGI app
# Docs: https://vercel.com/docs/functions/runtimes/python#asynchronous-server-gateway-interface

from src.api.main import app as app  # FastAPI app
