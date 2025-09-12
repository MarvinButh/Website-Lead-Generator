import os
import sys
import pytest
from fastapi.testclient import TestClient

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
BACKEND_ROOT = ROOT
SRC_DIR = os.path.join(BACKEND_ROOT, 'src')
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

# Force SQLite test database
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.pop("VERCEL", None)

from src.api.main import app  # noqa: E402
from src.db.engine import engine  # noqa: E402
from src.db.models.lead import Base  # noqa: E402

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
