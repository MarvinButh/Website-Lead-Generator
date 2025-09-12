"""add template tables

Revision ID: 20250911_add_template_tables
Revises: 20250911_add_scripts_columns
Create Date: 2025-09-11 00:30:00
"""
from alembic import op
import sqlalchemy as sa
from pathlib import Path
import os

# revision identifiers, used by Alembic.
revision = '20250911_add_template_tables'
down_revision = '20250911_add_scripts_columns'
branch_labels = None
depends_on = None

TEMPLATE_LANGS = ["en", "de", "es", "fr", "ru"]


def _load_fs_template(lang: str, filename: str) -> str:
    base = Path(__file__).resolve().parents[2] / 'templates' / lang / filename
    try:
        return base.read_text(encoding='utf-8')
    except Exception:
        return f"// MISSING TEMPLATE {lang}/{filename}"


def upgrade():
    op.create_table(
        'cold_email_templates',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('language', sa.String(length=10), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.UniqueConstraint('language', name='uq_cold_email_template_language')
    )
    op.create_table(
        'cold_phone_call_templates',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('language', sa.String(length=10), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.UniqueConstraint('language', name='uq_cold_phone_call_template_language')
    )
    op.create_table(
        'offer_sheet_templates',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('language', sa.String(length=10), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.UniqueConstraint('language', name='uq_offer_sheet_template_language')
    )

    conn = op.get_bind()
    for lang in TEMPLATE_LANGS:
        email_content = _load_fs_template(lang, 'cold_email_template.md')
        phone_content = _load_fs_template(lang, 'cold_phone_call_template.md')
        # For offer sheet we currently have only a docx template; store a placeholder mapping text
        offer_content = f"Offer sheet template placeholder for language {lang}. Use placeholders like {{BusinessName}} etc."
        conn.execute(sa.text(
            "INSERT INTO cold_email_templates (language, content, created_at, updated_at) VALUES (:l,:c, NOW(), NOW())"
        ), {"l": lang, "c": email_content})
        conn.execute(sa.text(
            "INSERT INTO cold_phone_call_templates (language, content, created_at, updated_at) VALUES (:l,:c, NOW(), NOW())"
        ), {"l": lang, "c": phone_content})
        conn.execute(sa.text(
            "INSERT INTO offer_sheet_templates (language, content, created_at, updated_at) VALUES (:l,:c, NOW(), NOW())"
        ), {"l": lang, "c": offer_content})


def downgrade():
    op.drop_table('offer_sheet_templates')
    op.drop_table('cold_phone_call_templates')
    op.drop_table('cold_email_templates')
