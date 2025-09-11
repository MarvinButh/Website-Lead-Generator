FROM python:3.11-slim

WORKDIR /app

# System deps for psycopg2 and docx
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY . /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Default port for local dev; Vercel/other platforms will provide $PORT
ENV PORT=8000
EXPOSE 8000

# Run the FastAPI server (bind to 0.0.0.0 and dynamic $PORT for platforms like Vercel)
CMD ["/bin/sh", "-lc", "uvicorn src.api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
