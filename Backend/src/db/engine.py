import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import logging
import urllib.parse

DB_HOST = os.getenv("DB_HOST", "db")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "website_service")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# Try to use the configured database (usually Postgres). If it is not reachable
# fall back to a lightweight local SQLite DB so the API can still start in
# development environments where Postgres isn't running.
engine = None
try:
    def _prepare_db_url(url: str) -> str:
        """Ensure the URL uses psycopg2 driver and has sslmode for Postgres providers like Neon."""
        if not url:
            return url
        u = url.strip()
        # Normalize short postgres scheme to include psycopg2 driver
        if u.startswith("postgres://"):
            u = u.replace("postgres://", "postgresql+psycopg2://", 1)
        elif u.startswith("postgresql://") and "+psycopg2" not in u:
            u = u.replace("postgresql://", "postgresql+psycopg2://", 1)
        # If Postgres URL has no sslmode, append sslmode=require (Neon requires SSL)
        parsed = urllib.parse.urlparse(u)
        if parsed.scheme and parsed.scheme.startswith("postgres") and "sslmode=" not in u:
            if "?" in u:
                u = u + "&sslmode=require"
            else:
                u = u + "?sslmode=require"
        return u

    final_url = _prepare_db_url(DATABASE_URL)
    # For Postgres/Neon explicitly pass sslmode in connect_args to help some environments
    connect_args = {}
    if final_url and final_url.startswith("postgres"):
        connect_args = {"sslmode": "require"}

    engine = create_engine(final_url, pool_pre_ping=True, connect_args=connect_args)
    # attempt a quick connection to validate reachability
    with engine.connect() as conn:  # type: ignore
        pass
    logging.info("Connected to primary database")
except Exception as e:
    logging.warning("Could not connect to primary DATABASE_URL (%s). Falling back to SQLite. Error: %s", DATABASE_URL, e)
    # On Vercel, writeable path is /tmp
    default_sqlite = "sqlite:////tmp/dev.db" if os.getenv("VERCEL") else "sqlite:///./dev.db"
    SQLITE_URL = os.getenv("SQLITE_URL", default_sqlite)
    # For SQLite we pass connect_args to allow usage from multiple threads (if needed)
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
