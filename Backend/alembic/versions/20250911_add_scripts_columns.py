"""add email/phone script columns

Revision ID: 20250911_add_scripts_columns
Revises: 20250910_add_interested_column
Create Date: 2025-09-11 00:00:00
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250911_add_scripts_columns'
down_revision = '20250910_add_interested_column'
branch_labels = None
depends_on = None


def upgrade():
    # Add columns to store generated outreach scripts and a timestamp
    op.add_column('leads', sa.Column('email_script', sa.Text(), nullable=True))
    op.add_column('leads', sa.Column('phone_script', sa.Text(), nullable=True))
    op.add_column('leads', sa.Column('scripts_generated_at', sa.DateTime(), nullable=True))


def downgrade():
    # Remove the added columns on downgrade
    op.drop_column('leads', 'scripts_generated_at')
    op.drop_column('leads', 'phone_script')
    op.drop_column('leads', 'email_script')
