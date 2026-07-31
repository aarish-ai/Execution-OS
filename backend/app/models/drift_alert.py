import uuid
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, Column, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class DriftAlert(Base):
    __tablename__ = "drift_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic_name = Column(String(255), nullable=False)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    meeting_count = Column(Integer, nullable=False)
    resolved = Column(Boolean, default=False, nullable=False)
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    topic = relationship("Topic")
