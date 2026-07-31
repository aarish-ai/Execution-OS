from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.models.task import TaskStatus


class MeetingCreate(BaseModel):
    title: str = Field(..., example="Sprint Planning")
    raw_transcript: str = Field(..., example="Ahmed: Let's discuss DB architecture...")


class TranscriptChunkSchema(BaseModel):
    id: str
    speaker: Optional[str]
    content: str
    chunk_index: int

    class Config:
        from_attributes = True


class DecisionSchema(BaseModel):
    id: str
    content: str
    owner: Optional[str]
    rationale: Optional[str]
    source_quote: str
    transcript_position: int

    class Config:
        from_attributes = True


class TaskSchema(BaseModel):
    id: str
    owner: str
    description: str
    deadline: Optional[date]
    status: TaskStatus
    source_quote: str
    transcript_position: int

    class Config:
        from_attributes = True


class TaskUpdate(BaseModel):
    status: Optional[TaskStatus] = None
    deadline: Optional[date] = None


class OpenQuestionSchema(BaseModel):
    id: str
    content: str
    raised_by: Optional[str]
    resolved: bool
    carried_forward_from: Optional[str]

    class Config:
        from_attributes = True


class ContradictionAlertSchema(BaseModel):
    id: str
    prior_decision_id: str
    conflicting_quote: str
    explanation: str
    dismissed: bool

    class Config:
        from_attributes = True


class MeetingDetailSchema(BaseModel):
    id: str
    title: str
    raw_transcript: str
    summary: Optional[str]
    health_score: Optional[float]
    meeting_date: datetime
    chunks: List[TranscriptChunkSchema] = []
    decisions: List[DecisionSchema] = []
    tasks: List[TaskSchema] = []
    open_questions: List[OpenQuestionSchema] = []
    contradictions: List[ContradictionAlertSchema] = []

    class Config:
        from_attributes = True


class MeetingSummarySchema(BaseModel):
    id: str
    title: str
    summary: Optional[str]
    health_score: Optional[float]
    meeting_date: datetime

    class Config:
        from_attributes = True


class SearchQuery(BaseModel):
    query: str
    meeting_id: Optional[str] = None
    top_k: int = 5


class AskQuery(BaseModel):
    question: str


class AskSource(BaseModel):
    meeting_id: str
    meeting_title: str
    chunk_index: int
    speaker: Optional[str]
    content: str


class AskResponse(BaseModel):
    answer: str
    sources: List[AskSource]
