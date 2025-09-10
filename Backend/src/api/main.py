import os
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import shutil

# Support both local and Docker imports
try:
    from src.db.engine import SessionLocal, engine
    from src.db.models.lead import Lead, Base
    from src.db.repositories.lead_repository import LeadRepository
except Exception:
    from Backend.src.db.engine import SessionLocal, engine  # type: ignore
    from Backend.src.db.models.lead import Lead, Base  # type: ignore
    from Backend.src.db.repositories.lead_repository import LeadRepository  # type: ignore

# Import pipeline helpers
try:
    import lead_auto_pipeline_de as pipeline
except Exception:
    from Backend import lead_auto_pipeline_de as pipeline  # type: ignore

# New: optional filter pipeline to auto-generate offers for low-website-quality leads
try:
    import lead_filter_pipeline as filter_pipeline  # type: ignore
except Exception:
    try:
        from Backend import lead_filter_pipeline as filter_pipeline  # type: ignore
    except Exception:
        filter_pipeline = None  # type: ignore

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
    interested: bool | None = None

    class Config:
        orm_mode = True
        # Keep pydantic v2 compatibility flag if available
        from_attributes = True


class GenerateLeadsIn(BaseModel):
    keywords: str | list[str] | None = None  # comma-separated string or list
    use_places: bool | None = None
    use_overpass: bool | None = None
    city: str | None = None
    country_code: str | None = None
    # New: when true, run filtering pipeline after inserting leads
    auto_filter: bool | None = None


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


@app.get("/leads/{lead_id}", response_model=LeadOut)
async def get_lead(lead_id: int):
    with SessionLocal() as session:
        row = session.query(Lead).filter(Lead.id == lead_id).first()
        if not row:
            raise HTTPException(status_code=404, detail="lead not found")
        return row


@app.patch("/leads/{lead_id}/interested")
async def update_interested(lead_id: int, payload: dict):
    """Payload: { "interested": true|false|null }"""
    val = payload.get("interested") if isinstance(payload, dict) else None
    if val not in (True, False, None):
        raise HTTPException(status_code=400, detail="invalid interested value")
    with SessionLocal() as session:
        row = session.query(Lead).filter(Lead.id == lead_id).first()
        if not row:
            raise HTTPException(status_code=404, detail="lead not found")
        row.interested = val
        session.add(row)
        session.commit()
        return {"ok": True, "interested": row.interested}


# Helper to resolve offers root directory (supports Docker shared volume)
def _get_offers_root() -> Path:
    # Prefer OFFERS_DIR, then OFFER_SHEETS_DIR, else fall back to pipeline default
    env_dir = os.getenv("OFFERS_DIR") or os.getenv("OFFER_SHEETS_DIR")
    if env_dir:
        return Path(env_dir)
    if filter_pipeline is not None:
        return Path(getattr(filter_pipeline, "DEFAULT_OUTPUT_DIR", "Backend/offer-sheets"))
    return Path("Backend/offer-sheets")


# Helper: run the filter pipeline against the DB and generate offers
def _run_auto_filter_offers(overwrite: bool = False) -> dict:
    if not filter_pipeline:
        return {"filtered": 0, "offers_generated": 0}
    try:
        # Load all leads from DB
        df = filter_pipeline.load_from_db()
        if df.empty:
            return {"filtered": 0, "offers_generated": 0}
        website_col = filter_pipeline.find_website_column(df)
        company_col = filter_pipeline.guess_company_column(df)
        filtered = filter_pipeline.filter_rows(df, website_col)
        if filtered.empty:
            return {"filtered": 0, "offers_generated": 0}
        # Ensure output dir exists (shared volume)
        output_root = _get_offers_root()
        filter_pipeline.ensure_dir(output_root)
        template_path = Path(getattr(filter_pipeline, "DEFAULT_TEMPLATE", "templates/docx/Angebot-Webseitenservice.docx"))
        generated = 0
        for _, row in filtered.iterrows():
            try:
                filter_pipeline.generate_offer(
                    row=row,
                    template_path=template_path,
                    company_col=company_col,
                    output_root=output_root,
                    overwrite=overwrite,
                )
                generated += 1
            except Exception:
                # continue on individual row errors
                pass
        return {"filtered": int(len(filtered)), "offers_generated": int(generated)}
    except Exception:
        return {"filtered": 0, "offers_generated": 0}


# New: generate offers for ALL current leads (not filtered)
def _run_generate_offers_for_all(overwrite: bool = False) -> dict:
    if not filter_pipeline:
        return {"total": 0, "offers_generated": 0}
    try:
        df = filter_pipeline.load_from_db()
        if df.empty:
            return {"total": 0, "offers_generated": 0}
        company_col = filter_pipeline.guess_company_column(df)
        output_root = _get_offers_root()
        filter_pipeline.ensure_dir(output_root)
        template_path = Path(getattr(filter_pipeline, "DEFAULT_TEMPLATE", "templates/docx/Angebot-Webseitenservice.docx"))
        generated = 0
        for _, row in df.iterrows():
            try:
                filter_pipeline.generate_offer(
                    row=row,
                    template_path=template_path,
                    company_col=company_col,
                    output_root=output_root,
                    overwrite=overwrite,
                )
                generated += 1
            except Exception:
                pass
        return {"total": int(len(df)), "offers_generated": int(generated)}
    except Exception:
        return {"total": 0, "offers_generated": 0}


# New: generate assets for a single lead by slug (company slug used for offer-sheets dir)
@app.post("/leads/{slug}/generate-assets")
async def generate_assets_for_slug(slug: str):
    if not filter_pipeline:
        return {"ok": False}
    try:
        df = filter_pipeline.load_from_db()
        if df.empty:
            return {"ok": False}
        company_col = filter_pipeline.guess_company_column(df)
        # Find row by slug
        target_row = None
        for _, row in df.iterrows():
            comp = str(row.get(company_col, ""))
            if filter_pipeline.slugify(comp) == slug:
                target_row = row
                break
        if target_row is None:
            return {"ok": False}
        output_root = _get_offers_root()
        filter_pipeline.ensure_dir(output_root)
        template_path = Path(getattr(filter_pipeline, "DEFAULT_TEMPLATE", "templates/docx/Angebot-Webseitenservice.docx"))
        filter_pipeline.generate_offer(
            row=target_row,
            template_path=template_path,
            company_col=company_col,
            output_root=output_root,
            overwrite=False,
        )
        return {"ok": True}
    except Exception:
        return {"ok": False}


# New: helper to run filter only (no generation)
def _run_filter_only() -> dict:
    # Keep leads with no website, empty website, or facebook URLs; remove the rest.
    try:
        with SessionLocal() as session:
            keep_cond = (Lead.website == None) | (Lead.website == "") | (Lead.website.ilike('%facebook%'))  # noqa: E711
            kept = session.query(Lead).filter(keep_cond).count()
            removed = session.query(Lead).filter(~keep_cond).delete(synchronize_session=False)
            session.commit()
            return {"filtered": int(kept), "removed": int(removed)}
    except Exception:
        try:
            session.rollback()  # type: ignore[name-defined]
        except Exception:
            pass
        return {"filtered": 0, "removed": 0}


@app.post("/leads/filter")
async def filter_leads():
    """Filters current leads and prunes DB by removing those with a proper website (non-empty and not Facebook)."""
    return _run_filter_only()


@app.post("/leads/generate-offers")
async def generate_offers():
    """Generates offers (DOCX + cold email/phone scripts + HTML summary) for ALL current leads."""
    return _run_generate_offers_for_all(overwrite=False)


@app.delete("/leads")
async def clear_leads():
    """Clears the database and removes all leads. Also deletes generated offer sheets folder if present."""
    deleted = 0
    with SessionLocal() as session:
        try:
            deleted = session.query(Lead).delete()
            session.commit()
        except Exception:
            session.rollback()
            deleted = 0
    # Remove offer-sheets directory if exists
    offer_dir = None
    try:
        offer_dir = _get_offers_root()
        if offer_dir.exists() and offer_dir.is_dir():
            shutil.rmtree(offer_dir, ignore_errors=True)
    except Exception:
        pass
    return {"deleted": int(deleted), "offers_dir_removed": bool(offer_dir and not offer_dir.exists())}


@app.post("/leads/generate")
async def generate_leads(payload: GenerateLeadsIn):
    # Resolve input/defaults
    if isinstance(payload.keywords, list):
        keywords = [s.strip() for s in payload.keywords if s and s.strip()]
    else:
        kw_str = payload.keywords or os.getenv("KEYWORDS", "")
        keywords = [s.strip() for s in kw_str.split(",") if s.strip()]

    use_places = payload.use_places if payload.use_places is not None else pipeline.USE_PLACES
    use_overpass = payload.use_overpass if payload.use_overpass is not None else pipeline.USE_OVERPASS
    city = payload.city or pipeline.CITY
    country_code = payload.country_code or pipeline.COUNTRY_CODE

    # Temporarily override pipeline module globals for this run
    # (keeps behavior consistent without refactor)
    old_city, old_cc = pipeline.CITY, pipeline.COUNTRY_CODE
    old_up, old_uo = pipeline.USE_PLACES, pipeline.USE_OVERPASS
    try:
        pipeline.CITY = city
        pipeline.COUNTRY_CODE = country_code
        pipeline.USE_PLACES = use_places
        pipeline.USE_OVERPASS = use_overpass

        # Collect
        all_rows = []
        if use_places:
            for kw in keywords:
                all_rows.extend(pipeline.collect_places_for_keyword(kw))
        if use_overpass:
            for kw in keywords:
                tags = pipeline.OSM_TAGS.get(kw, [])
                if not tags:
                    continue
                all_rows.extend(pipeline.overpass_query_bbox(city, country_code, tags))

        # Dedupe & score
        all_rows = pipeline.dedupe(all_rows)
        for r in all_rows:
            r["Score"] = pipeline.score_row(r)

        # Map to DB schema
        prepared: list[dict] = []
        for r in all_rows:
            prepared.append({
                "company_name": r.get("Firmenname") or r.get("name") or "",
                "website": r.get("Webseite") or None,
                "email": r.get("E-Mail") or None,
                "phone": r.get("Telefon") or None,
                "city": r.get("Stadt") or city,
                "industry": r.get("Kategorie") or None,
                "contact": r.get("Ansprechpartner") or None,
            })

        # Insert
        inserted = 0
        with SessionLocal() as session:
            repo = LeadRepository(session)
            if prepared:
                inserted = repo.upsert_many(prepared)

        # Optionally run filtering pipeline and generate offers
        filter_summary = None
        if getattr(payload, "auto_filter", None):
            filter_summary = _run_auto_filter_offers(overwrite=False)

        resp = {
            "inserted": inserted,
            "found": len(all_rows),
            "keywords": keywords,
            "city": city,
            "use_places": use_places,
            "use_overpass": use_overpass,
        }
        if filter_summary is not None:
            resp.update(filter_summary)
        return resp
    finally:
        pipeline.CITY = old_city
        pipeline.COUNTRY_CODE = old_cc
        pipeline.USE_PLACES = old_up
        pipeline.USE_OVERPASS = old_uo


