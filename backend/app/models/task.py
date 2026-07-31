import enum
import uuid
from datetime import datetime
from sqlalchemy import String, Text, Date, Integer, DateTime, ForeignKey, Enum as SQLEnum, Column
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
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    meeting = relationship("Meeting", back_populates="tasks")
