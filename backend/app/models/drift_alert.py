import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Column
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class DriftAlert(Base):
    __tablename__ = "drift_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic_name = Column(String(255), nullable=False)
    meeting_count = Column(Integer, nullable=False)
    last_seen = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
