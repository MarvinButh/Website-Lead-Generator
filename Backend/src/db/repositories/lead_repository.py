from typing import Iterable, List
from sqlalchemy.orm import Session
from ..models.lead import Lead

class LeadRepository:
    def __init__(self, session: Session):
        self.session = session

    def upsert_many(self, leads: Iterable[dict]) -> int:
        count = 0
        for data in leads:
            lead = Lead(**data)
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
