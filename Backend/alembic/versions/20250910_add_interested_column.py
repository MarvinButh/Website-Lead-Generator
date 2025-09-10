"""add interested column

Revision ID: 20250910_add_interested_column
Revises: 
Create Date: 2025-09-10 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250910_add_interested_column'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('leads', sa.Column('interested', sa.Boolean(), nullable=True))


def downgrade():
    op.drop_column('leads', 'interested')
