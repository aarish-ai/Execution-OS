import enum
import uuid
from sqlalchemy import String, Text, Date, Integer, DateTime, ForeignKey, Enum as SQLEnum, Column, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class TaskStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    OVERDUE = "overdue"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    owner = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    deadline = Column(Date, nullable=True, index=True)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.OPEN, nullable=False, index=True)
    source_quote = Column(Text, nullable=False)
    transcript_position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    meeting = relationship("Meeting", back_populates="tasks")
