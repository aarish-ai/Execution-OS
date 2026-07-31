from typing import TypedDict, Optional, List, Dict, Any


class MeetingState(TypedDict):
    raw_transcript: str
    meeting_id: str
    title: str
    chunks: List[Dict[str, Any]]
    extraction: Dict[str, Any]
    summary: str
    health_score: float
    contradiction_alerts: List[Dict[str, Any]]
    brief: Optional[str]
    errors: List[str]
