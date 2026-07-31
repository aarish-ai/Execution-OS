"""audit fixes: add decision embedding, question position, weekly brief dates, drift alert topic fk

Revision ID: 0002_audit_fixes
Revises: 0001_initial_schema
Create Date: 2026-07-31

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import pgvector

revision: str = '0002_audit_fixes'
down_revision: Union[str, None] = '0001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Decision embedding
    op.add_column('decisions', sa.Column('embedding', pgvector.sqlalchemy.Vector(768), nullable=True))

    # OpenQuestion position
    op.add_column('open_questions', sa.Column('transcript_position', sa.Integer(), nullable=True, server_default='0'))

    # WeeklyBrief date range
    op.add_column('weekly_briefs', sa.Column('week_start', sa.Date(), nullable=False, server_default=sa.text('CURRENT_DATE')))
    op.add_column('weekly_briefs', sa.Column('week_end', sa.Date(), nullable=False, server_default=sa.text('CURRENT_DATE')))

    # DriftAlert topic link & resolution status
    op.add_column('drift_alerts', sa.Column('topic_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('topics.id', ondelete='SET NULL'), nullable=True))
    op.add_column('drift_alerts', sa.Column('resolved', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('drift_alerts', 'resolved')
    op.drop_column('drift_alerts', 'topic_id')
    op.drop_column('weekly_briefs', 'week_end')
    op.drop_column('weekly_briefs', 'week_start')
    op.drop_column('open_questions', 'transcript_position')
    op.drop_column('decisions', 'embedding')
