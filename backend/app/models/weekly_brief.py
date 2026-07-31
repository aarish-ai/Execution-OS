import uuid
from sqlalchemy import Text, Date, DateTime, Column, func
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class WeeklyBrief(Base):
    __tablename__ = "weekly_briefs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content = Column(Text, nullable=False)
    week_start = Column(Date, nullable=False)
    week_end = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
