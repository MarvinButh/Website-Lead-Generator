#!/usr/bin/env python3
"""
Clear the entire PostgreSQL database used by this project.

- Reads DATABASE_URL from .env (or builds it from DB_* vars)
- Asks for confirmation unless --force is provided
- Attempts to DROP SCHEMA public CASCADE; then recreates it
- Falls back to dropping all tables via SQLAlchemy if schema drop fails

Usage:
  python3 scripts/clear_database.py [--force] [--url postgresql+psycopg2://...]
"""
from __future__ import annotations

import argparse
import os
import sys

from dotenv import load_dotenv, find_dotenv
from sqlalchemy import create_engine, text, MetaData
from sqlalchemy.engine import Engine


def get_db_url() -> str | None:
    url = os.getenv("DATABASE_URL")
    if url:
        return url
    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME")
    user = os.getenv("DB_USER")
    pwd = os.getenv("DB_PASSWORD")
    if all([host, port, name, user, pwd]):
        return f"postgresql+psycopg2://{user}:{pwd}@{host}:{port}/{name}"
    return None


def confirm_danger(url: str, force: bool) -> None:
    if force:
        return
    print("WARNING: You are about to irreversibly DELETE ALL DATA in:")
    print(f"  {url}\n")
    print("This will drop all tables (and attempt to reset the 'public' schema).")
    ans = input("Type CLEAR to proceed: ").strip()
    if ans != "CLEAR":
        print("Aborted.")
        sys.exit(1)


def drop_schema_public(engine: Engine) -> None:
    with engine.begin() as conn:
        # Drop and recreate the public schema (best-effort)
        conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        # Re-grant common privileges
        conn.execute(text("GRANT USAGE ON SCHEMA public TO public"))
        conn.execute(text("GRANT CREATE ON SCHEMA public TO public"))


def drop_all_tables(engine: Engine) -> None:
    meta = MetaData()
    meta.reflect(bind=engine)
    if meta.tables:
        with engine.begin() as conn:
            meta.drop_all(bind=conn)


def main() -> int:
    load_dotenv(find_dotenv())

    parser = argparse.ArgumentParser(description="Clear the project's PostgreSQL database")
    parser.add_argument("--force", action="store_true", help="Skip confirmation prompt")
    parser.add_argument("--url", help="Override database URL (postgresql+psycopg2://...)")
    args = parser.parse_args()

    url = args.url or get_db_url()
    if not url:
        print("ERROR: DATABASE_URL or DB_* variables are not set in .env, and --url not provided.")
        return 2

    confirm_danger(url, args.force)

    try:
        engine = create_engine(url, pool_pre_ping=True, future=True)
        # Test connection early
        with engine.connect() as _:
            pass
    except Exception as e:
        print(f"ERROR: Could not connect to database: {e}")
        return 3

    # Try drop schema first, then fallback to dropping tables
    try:
        drop_schema_public(engine)
        print("Successfully reset 'public' schema.")
        return 0
    except Exception as e:
        print(f"Could not drop schema 'public' ({e}). Falling back to dropping all tables…")
        try:
            drop_all_tables(engine)
            print("Successfully dropped all tables.")
            return 0
        except Exception as e2:
            print(f"ERROR: Failed to drop all tables: {e2}")
            return 4


if __name__ == "__main__":
    raise SystemExit(main())
