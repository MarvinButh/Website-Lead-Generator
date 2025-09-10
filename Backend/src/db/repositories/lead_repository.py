from typing import Iterable, List
from sqlalchemy.orm import Session
from sqlalchemy import inspect
from ..models.lead import Lead

class LeadRepository:
    def __init__(self, session: Session):
        self.session = session

    def upsert_many(self, leads: Iterable[dict]) -> int:
        count = 0
        # Inspect DB columns for 'leads' table and only pass known keys to the model
        try:
            inspector = inspect(self.session.bind)
            cols = {c['name'] for c in inspector.get_columns('leads')}
        except Exception:
            cols = set()

        for data in leads:
            # Filter out any keys not present in the DB table to avoid insert errors
            filtered = {k: v for k, v in data.items() if not cols or k in cols}
            lead = Lead(**filtered)
            self.session.add(lead)
            count += 1
        self.session.commit()
        return count

    def list_to_contact(self) -> List[Lead]:
        # Example: leads with no website or a facebook link
        return (
            self.session.query(Lead)
            .filter((Lead.website == None) | (Lead.website.ilike('%facebook%')))  # noqa: E711
            .all()
        )
