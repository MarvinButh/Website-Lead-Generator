import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, root_validator
try:
    from pydantic import ConfigDict  # pydantic v2
except Exception:
    ConfigDict = None  # type: ignore
from pathlib import Path
import shutil
import logging
from sqlalchemy import text
from sqlalchemy import inspect
from datetime import datetime
import re
import unicodedata
import traceback

# track import errors for diagnostics
pipeline_import_error: str | None = None
filter_pipeline_import_error: str | None = None

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
    # prefer package-style import when running from src/ layout
    from src import lead_auto_pipeline_de as pipeline
except Exception as e:
    try:
        # fallback when running from repository root where Backend/ is top-level
        from Backend import lead_auto_pipeline_de as pipeline  # type: ignore
    except Exception as e2:
        pipeline = None  # type: ignore
        pipeline_import_error = (str(e2) or str(e) or "unknown error") + "\n" + traceback.format_exc()

# New: optional filter pipeline to auto-generate offers for low-website-quality leads
try:
    from src import lead_filter_pipeline as filter_pipeline
except Exception as e:
    try:
        from Backend import lead_filter_pipeline as filter_pipeline  # type: ignore
    except Exception as e2:
        filter_pipeline = None  # type: ignore
        filter_pipeline_import_error = (str(e2) or str(e) or "unknown error") + "\n" + traceback.format_exc()

app = FastAPI(title="Website Service API")

# CORS for local dev (Next.js runs on 3000 by default)
# Flexible CORS configuration: FRONTEND_ORIGIN may be a single origin, a comma-separated list, or "*" to allow all origins in development.
raw_origins = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000").strip()
if raw_origins == "*":
    allow_origins = ["*"]
else:
    allow_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
    # always include common localhost ports used by Next.js dev server
    allow_origins.extend(["http://localhost:3000", "http://127.0.0.1:3000"])
    # dedupe while preserving order
    seen = set()
    deduped = []
    for o in allow_origins:
        if o not in seen:
            deduped.append(o)
            seen.add(o)
    allow_origins = deduped

# Toggle whether cookies/credentials are allowed in CORS. Default false to be safe when using "*".
allow_credentials = (os.getenv("CORS_ALLOW_CREDENTIALS", "false").lower() == "true")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper: parse truthy values from strings/bools
def _is_truthy(val) -> bool:
    if isinstance(val, bool):
        return val
    if val is None:
        return False
    try:
        return str(val).strip().lower() in {"1", "true", "yes", "on"}
    except Exception:
        return False


def _env_truthy(name: str, default: bool = False) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return _is_truthy(val)


# Mapping from client outreach keys to env variable names used by filter pipeline
OUTREACH_ENV_MAP: dict[str, str] = {
    "yourName": "YOUR_NAME",
    "yourTitle": "YOUR_TITLE",
    "yourCompany": "YOUR_COMPANY",
    "yourEmail": "YOUR_EMAIL",
    "yourPhone": "YOUR_PHONE",
    "yourWebsite": "YOUR_WEBSITE",
    "calendarLink": "CALENDAR_LINK",
    "projectLink": "PROJECT_LINK",
    "shortOutcome": "SHORT_OUTCOME",
    "defaultPrice": "DEFAULT_PRICE",
    "defaultPages": "DEFAULT_PAGES",
    "defaultTimeline": "DEFAULT_TIMELINE",
    "supportPeriod": "SUPPORT_PERIOD",
    # Optional extras if present in future
    "defaultRole": "DEFAULT_ROLE",
}


def _apply_outreach_to_env(outreach: Optional[dict]) -> dict[str, Optional[str]]:
    """Set environment variables from outreach dict and return a map of previous values for restoration."""
    prev: dict[str, Optional[str]] = {}
    if not isinstance(outreach, dict):
        return prev
    # capture previous
    for env_name in OUTREACH_ENV_MAP.values():
        prev[env_name] = os.getenv(env_name)
    # set new values
    for key, env_name in OUTREACH_ENV_MAP.items():
        val = outreach.get(key)
        if isinstance(val, (str, int, float)):
            sval = str(val).strip()
            if sval:
                os.environ[env_name] = sval
    return prev


def _restore_env(prev: dict[str, Optional[str]]):
    for env_name, old_val in (prev or {}).items():
        if old_val is None:
            try:
                del os.environ[env_name]
            except Exception:
                pass
        else:
            os.environ[env_name] = old_val


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
        # Keep pydantic v2 compatibility flag
        from_attributes = True


class GenerateLeadsIn(BaseModel):
    keywords: str | list[str] | None = None  # comma-separated string or list
    use_places: bool | None = None
    use_overpass: bool | None = None
    city: str | None = None
    country_code: str | None = None
    # Prefer camelCase `autoFilter` (frontend) — still accept snake_case for backward compatibility
    autoFilter: bool | None = Field(None, alias="auto_filter")
    # New: template language from frontend settings (camelCase alias)
    template_lang: str | None = Field(None, alias="templateLang")
    # New: outreach defaults from settings page to drive templates
    outreach: dict[str, str] | None = None

    # pydantic v2: ensure we accept population by field name (camelCase)
    if ConfigDict is not None:  # type: ignore[name-defined]
        model_config = ConfigDict(populate_by_name=True)  # type: ignore[misc]

    # Ensure we accept both `autoFilter` and `auto_filter` in incoming payloads
    @root_validator(pre=True)
    def _coalesce_auto_filter(cls, values):  # type: ignore[no-redef]
        try:
            if isinstance(values, dict):
                if "autoFilter" not in values and "auto_filter" in values:
                    values["autoFilter"] = values.get("auto_filter")
        except Exception:
            pass
        return values


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


@app.get("/leads")
async def list_leads(page: int = 1, page_size: int = 250, q: Optional[str] = None):
    """List leads with optional text filter and pagination. Returns { items, total }."""
    # enforce sane bounds
    page = max(1, int(page))
    page_size = max(1, min(1000, int(page_size)))
    offset = (page - 1) * page_size

    try:
        with SessionLocal() as session:
            query = session.query(Lead)
            if q:
                term = f"%{q}%"
                # search across common text fields
                query = query.filter(
                    (Lead.company_name.ilike(term)) |
                    (Lead.city.ilike(term)) |
                    (Lead.industry.ilike(term)) |
                    (Lead.email.ilike(term)) |
                    (Lead.phone.ilike(term))
                )
            total = query.count()
            rows = query.order_by(Lead.id.desc()).offset(offset).limit(page_size).all()
            items = [r for r in rows]
            return {"items": items, "total": total}
    except Exception as e:
        # Log full traceback for server logs and return a generic 500 to the client
        try:
            logging.getLogger("uvicorn.error").exception("Error in /leads: %s", e)
        except Exception:
            pass
        raise HTTPException(status_code=500, detail="internal server error")


# Debug endpoint to test database connectivity and engine type. Use carefully in private deployments.
@app.get("/debug/db")
async def debug_db():
    info = {"engine_present": bool(engine)}
    try:
        # Detect if using SQLite (file path) vs Postgres
        url = str(getattr(engine, "url", "")) if engine is not None else ""
        info["engine_url_preview"] = (url[:200] + "...") if url else ""
        # Try a simple connection and quick query
        with engine.connect() as conn:  # type: ignore
            try:
                # run a lightweight check depending on dialect
                dialect = getattr(engine, "dialect", None)
                info["dialect"] = getattr(dialect, "name", None)
            except Exception:
                pass
            try:
                res = conn.execute("SELECT 1")  # type: ignore
                info["connection_ok"] = True
            except Exception as e:
                info["connection_ok"] = False
                try:
                    logging.getLogger("uvicorn.error").exception("DB probe failed: %s", e)
                except Exception:
                    pass
            # Use SQLAlchemy text() for raw SQL to avoid ObjectNotExecutableError
            try:
                conn.execute(text("SELECT 1"))  # type: ignore
                info["connection_ok"] = True
            except Exception:
                # If this also fails, connection_ok remains False and original exception logged above
                pass
    except Exception as e:
        info["error"] = str(e)
        try:
            logging.getLogger("uvicorn.error").exception("Error in /debug/db: %s", e)
        except Exception:
            pass
    return info


# Debug helper: create missing tables (safe to call in private deployments)
@app.post("/debug/create_tables")
async def debug_create_tables():
    try:
        Base.metadata.create_all(engine)
        try:
            tables = inspect(engine).get_table_names()
        except Exception:
            tables = []
        return {"ok": True, "tables": tables}
    except Exception as e:
        try:
            logging.getLogger("uvicorn.error").exception("Create tables failed: %s", e)
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))


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
    # On Vercel, the filesystem is read-only except for /tmp
    if os.getenv("VERCEL") == "1" or os.getenv("VERCEL", "").lower() in {"true", "yes"}:
        return Path("/tmp/offer-sheets")
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

        # After generation, try to read generated scripts and persist them into the DB
        def _read_text(p: Path) -> Optional[str]:
            try:
                return p.read_text(encoding="utf-8")
            except Exception:
                return None

        # locate the generated directory (case-insensitive)
        target_dir = output_root / slug.lower()
        if not target_dir.exists() or not target_dir.is_dir():
            try:
                for entry in output_root.iterdir():
                    if entry.is_dir() and entry.name.lower() == slug.lower():
                        target_dir = entry
                        break
            except Exception:
                pass

        email_script = _read_text(target_dir / "cold_email.md") or ""
        phone_script = _read_text(target_dir / "cold_phone_call.md") or ""

        # Diagnostics logging for troubleshooting persistence
        try:
            logging.getLogger("uvicorn.error").debug("Assets target_dir=%s", str(target_dir))
            logging.getLogger("uvicorn.error").debug("Read email_script length=%d, phone_script length=%d", len(email_script), len(phone_script))
        except Exception:
            pass

        persisted = False
        
        if email_script or phone_script:
            try:
                with SessionLocal() as session:
                    # Find matching Lead by slugifying company_name (fallback to exact company_name match)
                    candidates = session.query(Lead).filter(Lead.company_name != None).all()
                    matched = None
                    for l in candidates:
                        try:
                            # log candidate comparison
                            try:
                                logging.getLogger("uvicorn.error").debug("Checking candidate id=%s name=%s", getattr(l, 'id', None), getattr(l, 'company_name', None))
                            except Exception:
                                pass
                            if filter_pipeline and filter_pipeline.slugify(l.company_name) == slug:
                                matched = l
                                break
                            # Fallback: direct case-insensitive company name match against source row if available
                            try:
                                source_name = str(target_row.get(company_col, "") or "").strip().lower()
                            except Exception:
                                source_name = ""
                            if source_name and isinstance(l.company_name, str) and l.company_name.strip().lower() == source_name:
                                matched = l
                                break
                        except Exception:
                            continue
                    if not matched:
                        try:
                            logging.getLogger("uvicorn.error").debug("No DB lead matched for slug %s (checked %d candidates)", slug, len(candidates))
                        except Exception:
                            pass
                    if matched:
                        # only set if non-empty to avoid clobbering blanks
                        if email_script:
                            matched.email_script = email_script
                        if phone_script:
                            matched.phone_script = phone_script
                        matched.scripts_generated_at = datetime.utcnow()
                        session.add(matched)
                        session.commit()
                        persisted = True
            except Exception:
                # Don't fail the entire endpoint if DB write fails
                try:
                    logging.getLogger("uvicorn.error").exception("Failed to persist scripts for slug %s", slug)
                except Exception:
                    pass

        return {"ok": True, "persisted": persisted, "email_len": len(email_script), "phone_len": len(phone_script), "target_dir": str(target_dir)}
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
async def generate_leads(payload: GenerateLeadsIn, request: Request):
    # Resolve input/defaults
    if isinstance(payload.keywords, list):
        keywords = [s.strip() for s in payload.keywords if s and s.strip()]
    else:
        kw_str = payload.keywords or os.getenv("KEYWORDS", "")
        keywords = [s.strip() for s in kw_str.split(",") if s.strip()]

    use_places = payload.use_places if payload.use_places is not None else bool(pipeline.USE_PLACES)
    use_overpass = payload.use_overpass if payload.use_overpass is not None else bool(pipeline.USE_OVERPASS)
    # Ensure robust defaults for location; prevent None reaching the pipeline
    city = (payload.city or getattr(pipeline, "CITY", None) or os.getenv("CITY") or "Berlin")
    country_code = (payload.country_code or getattr(pipeline, "COUNTRY_CODE", None) or os.getenv("COUNTRY_CODE") or "DE")
    city = str(city).strip() if city is not None else "Berlin"
    country_code = str(country_code).strip() if country_code is not None else "DE"
    if not city or not country_code:
        # Disable Overpass if we lack location context
        use_overpass = False

    # Temporarily override pipeline module globals for this run
    # (keeps behavior consistent without refactor)
    old_city, old_cc = pipeline.CITY, pipeline.COUNTRY_CODE
    old_up, old_uo = pipeline.USE_PLACES, pipeline.USE_OVERPASS
    # New: temporarily override TEMPLATE_LANG env based on request
    old_tpl_lang = os.getenv("TEMPLATE_LANG")
    # New: temporarily apply outreach envs
    outreach_prev_env: dict[str, Optional[str]] = {}
    try:
        pipeline.CITY = city
        pipeline.COUNTRY_CODE = country_code
        pipeline.USE_PLACES = use_places
        pipeline.USE_OVERPASS = use_overpass
        
        # If client provided a template language, apply for offer generation
        if isinstance(payload.template_lang, str) and payload.template_lang.strip():
            os.environ["TEMPLATE_LANG"] = payload.template_lang.strip()
        
        # If client provided outreach defaults, temporarily set envs used by generator
        outreach_prev_env = _apply_outreach_to_env(payload.outreach)
        
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
                try:
                    results = pipeline.overpass_query_bbox(city, country_code, tags)
                    if results:
                        all_rows.extend(results)
                except Exception as e:
                    # Log and continue on external HTTP errors (e.g. Nominatim 403) or other failures
                    try:
                        logging.getLogger("uvicorn.error").warning(
                            "Overpass/Nominatim error for keyword %s: %s", kw, e
                        )
                    except Exception:
                        pass

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
        # Respect either camelCase `autoFilter` (preferred) or legacy `auto_filter`
        auto_val = getattr(payload, "autoFilter", None)
        # Fall back to raw body if needed
        if auto_val is None:
            try:
                raw_body = await request.json()
                auto_val = raw_body.get("autoFilter", raw_body.get("auto_filter"))
            except Exception:
                pass
        should_auto_filter = _is_truthy(auto_val) or (auto_val is None and _env_truthy("AUTO_FILTER", False))
        try:
            logging.getLogger("uvicorn.error").info("autoFilter resolved=%s (payload=%s)", should_auto_filter, auto_val)
        except Exception:
            pass
        if should_auto_filter:
            # Always prune DB first so only low-website-quality leads remain
            print("AUTOMATICALLY FILTERING " + str(len(all_rows)) + " LEADS")
            simple = _run_filter_only()
            offers_generated = 0
            if filter_pipeline:
                # Then generate offers for all remaining leads
                offer_res = _run_generate_offers_for_all(overwrite=False)
                try:
                    offers_generated = int(offer_res.get("offers_generated", 0)) if isinstance(offer_res, dict) else 0
                except Exception:
                    offers_generated = 0
            # Provide a unified summary back to the client
            filter_summary = {
                "filtered": simple.get("filtered", 0),
                "removed": simple.get("removed", 0),
                "offers_generated": offers_generated,
            }

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
        # Restore TEMPLATE_LANG env
        if old_tpl_lang is None:
            try:
                del os.environ["TEMPLATE_LANG"]
            except Exception:
                pass
        else:
            os.environ["TEMPLATE_LANG"] = old_tpl_lang
        # Restore outreach envs
        try:
            _restore_env(outreach_prev_env)
        except Exception:
            pass


# New: serve a summary of generated assets for a given slug. If missing, try to generate once.
@app.get("/assets/{slug}/summary")
async def get_assets_summary(slug: str):
    root = _get_offers_root()
    # Try lowercase dir first, then scan for case-insensitive match
    target = root / slug.lower()
    if not target.exists() or not target.is_dir():
        try:
            for entry in root.iterdir():
                if entry.is_dir() and entry.name.lower() == slug.lower():
                    target = entry
                    break
        except Exception:
            pass

    def _read_text(p: Path) -> Optional[str]:
        try:
            return p.read_text(encoding="utf-8")
        except Exception:
            return None
    def _read_json(p: Path) -> Optional[dict]:
        try:
            import json
            return json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            return None

    # First: attempt to fetch scripts from DB (preferred for serverless envs)
    db_email = ""
    db_phone = ""
    db_ts = None
    try:
        with SessionLocal() as session:
            candidates = session.query(Lead).filter(Lead.company_name != None).all()
            for l in candidates:
                try:
                    if filter_pipeline and filter_pipeline.slugify(l.company_name) == slug:
                        db_email = (l.email_script or "") if hasattr(l, 'email_script') else ""
                        db_phone = (l.phone_script or "") if hasattr(l, 'phone_script') else ""
                        db_ts = getattr(l, 'scripts_generated_at', None)
                        break
                except Exception:
                    continue
    except Exception:
        pass

    meta = _read_json(target / "metadata.json")
    file_email = _read_text(target / "cold_email.md") or ""
    file_phone = _read_text(target / "cold_phone_call.md") or ""

    # Prefer DB scripts when present (non-empty), otherwise fall back to filesystem
    email_script = db_email or file_email or ""
    phone_script = db_phone or file_phone or ""

    # If metadata is missing OR both scripts are missing, attempt generation once
    if filter_pipeline and (meta is None or (not email_script and not phone_script)):
        # Try to generate once
        try:
            await generate_assets_for_slug(slug)  # type: ignore
            meta = _read_json(target / "metadata.json")

            # after generation we re-check DB first, then files
            try:
                with SessionLocal() as session:
                    candidates = session.query(Lead).filter(Lead.company_name != None).all()
                    for l in candidates:
                        try:
                            if filter_pipeline and filter_pipeline.slugify(l.company_name) == slug:
                                db_email = (l.email_script or "") if hasattr(l, 'email_script') else ""
                                db_phone = (l.phone_script or "") if hasattr(l, 'phone_script') else ""
                                db_ts = getattr(l, 'scripts_generated_at', None)
                                break
                        except Exception:
                            continue
            except Exception:
                pass

            file_email = _read_text(target / "cold_email.md") or file_email
            file_phone = _read_text(target / "cold_phone_call.md") or file_phone
            email_script = db_email or file_email or email_script
            phone_script = db_phone or file_phone or phone_script
        except Exception:
            pass

    return {
        "ok": bool(meta is not None or email_script or phone_script),
        "meta": meta,
        "emailScript": email_script,
        "phoneScript": phone_script,
        "scriptsGeneratedAt": (db_ts.isoformat() if db_ts is not None else None),
    }


# Debug endpoint: report whether filter pipeline is available (helps diagnose Vercel deploys)
@app.get("/debug/filter_pipeline")
async def debug_filter_pipeline():
    info = {
        "filter_pipeline_present": bool(filter_pipeline),
        "pipeline_present": bool(pipeline),
    }
    try:
        if filter_pipeline is not None:
            info["filter_pipeline_default_output_dir"] = getattr(filter_pipeline, "DEFAULT_OUTPUT_DIR", None)
            info["filter_pipeline_default_template"] = getattr(filter_pipeline, "DEFAULT_TEMPLATE", None)
    except Exception:
        pass
    try:
        # Include a short probe of importability: attempt to access slugify if present
        if filter_pipeline is not None and hasattr(filter_pipeline, "slugify"):
            info["has_slugify"] = True
        else:
            info["has_slugify"] = False
    except Exception:
        info["has_slugify"] = False
    # Add captured import errors for debugging
    info["pipeline_import_error"] = pipeline_import_error
    info["filter_pipeline_import_error"] = filter_pipeline_import_error
    return info


