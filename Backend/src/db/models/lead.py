from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, UniqueConstraint
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class Lead(Base):
    __tablename__ = 'leads'

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_name = Column(String, nullable=False)
    website = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    city = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    contact = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    interested = Column(Boolean, nullable=True)
    # New: store generated outreach scripts directly in DB for serverless deployments
    email_script = Column(Text, nullable=True)
    phone_script = Column(Text, nullable=True)
    scripts_generated_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return (
            f"<Lead(id={self.id}, company_name='{self.company_name}', website='{self.website}', "
            f"email='{self.email}', phone='{self.phone}', interested={self.interested})>"
        )


class ColdEmailTemplate(Base):
    __tablename__ = 'cold_email_templates'
    id = Column(Integer, primary_key=True, autoincrement=True)
    language = Column(String(10), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    __table_args__ = (UniqueConstraint('language', name='uq_cold_email_template_language'),)

class ColdPhoneCallTemplate(Base):
    __tablename__ = 'cold_phone_call_templates'
    id = Column(Integer, primary_key=True, autoincrement=True)
    language = Column(String(10), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    __table_args__ = (UniqueConstraint('language', name='uq_cold_phone_call_template_language'),)

class OfferSheetTemplate(Base):
    __tablename__ = 'offer_sheet_templates'
    id = Column(Integer, primary_key=True, autoincrement=True)
    language = Column(String(10), nullable=False)
    content = Column(Text, nullable=False)  # Could store raw DOCX XML or markdown/HTML placeholders
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    __table_args__ = (UniqueConstraint('language', name='uq_offer_sheet_template_language'),)
