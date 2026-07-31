import uuid
from datetime import datetime
from sqlalchemy import Text, Boolean, DateTime, ForeignKey, Column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class ContradictionAlert(Base):
    __tablename__ = "contradiction_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    prior_decision_id = Column(UUID(as_uuid=True), ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False)
    conflicting_quote = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    dismissed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    meeting = relationship("Meeting", back_populates="contradictions")
    prior_decision = relationship("Decision", back_populates="contradictions")
