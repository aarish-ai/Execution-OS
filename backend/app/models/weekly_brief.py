import uuid
from datetime import datetime
from sqlalchemy import Text, DateTime, Column
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class WeeklyBrief(Base):
    __tablename__ = "weekly_briefs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
