from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.topic import Topic
from app.models.meeting import Meeting
from app.models.decision import Decision

router = APIRouter()


class TopicDetailResponse(BaseModel):
    id: str
    name: str
    occurrence_count: int
    meetings: List[Dict[str, Any]]
    decisions: List[Dict[str, Any]]
    created_at: datetime


@router.get("/", response_model=List[TopicDetailResponse])
async def list_topics(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Topic).options(
            selectinload(Topic.meeting),
            selectinload(Topic.decisions),
        )
    )
    topics = res.scalars().all()

    # Group topics by name across meetings
    topic_groups: Dict[str, Dict[str, Any]] = {}

    for t in topics:
        key = t.name.strip()
        if key not in topic_groups:
            topic_groups[key] = {
                "id": str(t.id),
                "name": key,
                "occurrence_count": 0,
                "meetings": [],
                "decisions": [],
                "created_at": t.created_at,
            }

        topic_groups[key]["occurrence_count"] += 1

        if t.meeting:
            topic_groups[key]["meetings"].append({
                "id": str(t.meeting.id),
                "title": t.meeting.title,
                "date": t.meeting.meeting_date.isoformat() if t.meeting.meeting_date else None,
            })

        for d in t.decisions:
            topic_groups[key]["decisions"].append({
                "id": str(d.id),
                "content": d.content,
                "owner": d.owner,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            })

    return [TopicDetailResponse(**val) for val in topic_groups.values()]
