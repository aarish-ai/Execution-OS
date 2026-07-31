import uuid
from datetime import datetime
from sqlalchemy import String, Text, Float, DateTime, Column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    raw_transcript = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    health_score = Column(Float, nullable=True)
    meeting_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    topics = relationship("Topic", back_populates="meeting", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="meeting", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="meeting", cascade="all, delete-orphan")
    open_questions = relationship("OpenQuestion", back_populates="meeting", cascade="all, delete-orphan")
    chunks = relationship("TranscriptChunk", back_populates="meeting", cascade="all, delete-orphan")
    contradictions = relationship("ContradictionAlert", back_populates="meeting", cascade="all, delete-orphan")
