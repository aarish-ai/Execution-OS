import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, Column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    content = Column(Text, nullable=False)
    owner = Column(String(255), nullable=True)
    rationale = Column(Text, nullable=True)
    source_quote = Column(Text, nullable=False)
    transcript_position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    meeting = relationship("Meeting", back_populates="decisions")
    topic = relationship("Topic", back_populates="decisions")
    contradictions = relationship("ContradictionAlert", back_populates="prior_decision", cascade="all, delete-orphan")
