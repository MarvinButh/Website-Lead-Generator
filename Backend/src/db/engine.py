import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import logging

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
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
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
