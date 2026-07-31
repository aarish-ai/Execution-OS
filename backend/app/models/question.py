import uuid
from datetime import datetime
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, Column
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
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    meeting = relationship("Meeting", back_populates="open_questions")
    parent_question = relationship("OpenQuestion", remote_side=[id])
