import os
from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Support both local and Docker imports
try:
    from src.db.engine import SessionLocal, engine
    from src.db.models.lead import Lead, Base
except Exception:
    from Backend.src.db.engine import SessionLocal, engine  # type: ignore
    from Backend.src.db.models.lead import Lead, Base  # type: ignore

app = FastAPI(title="Website Service API")

# CORS for local dev (Next.js runs on 3000 by default)
origins = [
    os.getenv("FRONTEND_ORIGIN", "http://localhost:3000"),
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(origins)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LeadOut(BaseModel):
    id: int
    company_name: str
    website: str | None = None
    email: str | None = None
    phone: str | None = None
    city: str | None = None
    industry: str | None = None
    contact: str | None = None

    class Config:
        from_attributes = True


@app.on_event("startup")
async def on_startup():
    # Ensure tables exist
    try:
        Base.metadata.create_all(engine)
    except Exception:
        pass


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/leads", response_model=List[LeadOut])
async def list_leads():
    with SessionLocal() as session:
        rows = session.query(Lead).order_by(Lead.id.desc()).limit(250).all()
        return rows
