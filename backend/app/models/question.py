import uuid
from sqlalchemy import String, Text, Boolean, Integer, DateTime, ForeignKey, Column, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class OpenQuestion(Base):
    __tablename__ = "open_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    raised_by = Column(String(255), nullable=True)
    resolved = Column(Boolean, default=False, nullable=False)
    carried_forward_from = Column(UUID(as_uuid=True), ForeignKey("open_questions.id", ondelete="SET NULL"), nullable=True)
    transcript_position = Column(Integer, nullable=True, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    meeting = relationship("Meeting", back_populates="open_questions")
    parent_question = relationship("OpenQuestion", remote_side=[id])
