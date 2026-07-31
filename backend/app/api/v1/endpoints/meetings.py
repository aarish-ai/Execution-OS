import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Meeting
from app.schemas import MeetingCreate, MeetingDetailSchema, MeetingSummarySchema
from app.pipelines.graph import run_pipeline

router = APIRouter()


@router.post("/", response_model=MeetingSummarySchema, status_code=status.HTTP_201_CREATED)
async def create_meeting(
    payload: MeetingCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    meeting_id = str(uuid.uuid4())
    meeting = Meeting(
        id=uuid.UUID(meeting_id),
        title=payload.title,
        raw_transcript=payload.raw_transcript,
    )
    db.add(meeting)
    await db.commit()
    await db.refresh(meeting)

    # Run pipeline in background task or inline
    await run_pipeline(
        raw_transcript=payload.raw_transcript,
        meeting_id=meeting_id,
        title=payload.title,
        session=db,
    )

    await db.refresh(meeting)
    return meeting


@router.get("/", response_model=List[MeetingSummarySchema])
async def list_meetings(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Meeting).order_by(Meeting.created_at.desc()))
    return res.scalars().all()


@router.get("/{meeting_id}", response_model=MeetingDetailSchema)
async def get_meeting(meeting_id: str, db: AsyncSession = Depends(get_db)):
    try:
        m_uuid = uuid.UUID(meeting_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid meeting UUID")

    res = await db.execute(
        select(Meeting)
        .options(
            selectinload(Meeting.chunks),
            selectinload(Meeting.decisions),
            selectinload(Meeting.tasks),
            selectinload(Meeting.open_questions),
            selectinload(Meeting.contradictions),
        )
        .where(Meeting.id == m_uuid)
    )
    meeting = res.scalars().first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meeting(meeting_id: str, db: AsyncSession = Depends(get_db)):
    try:
        m_uuid = uuid.UUID(meeting_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid meeting UUID")

    res = await db.execute(select(Meeting).where(Meeting.id == m_uuid))
    meeting = res.scalars().first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    await db.delete(meeting)
    await db.commit()


@router.get("/{meeting_id}/brief")
async def get_meeting_brief(meeting_id: str, db: AsyncSession = Depends(get_db)):
    m = await get_meeting(meeting_id, db)
    return {"brief": f"# Pre-Meeting Brief for {m.title}\n## Summary\n{m.summary or 'No summary yet'}"}


@router.get("/{meeting_id}/health")
async def get_meeting_health(meeting_id: str, db: AsyncSession = Depends(get_db)):
    m = await get_meeting(meeting_id, db)
    return {
        "meeting_id": str(m.id),
        "health_score": m.health_score or 0.0,
        "decisions_count": len(m.decisions),
        "tasks_count": len(m.tasks),
        "questions_count": len(m.open_questions),
    }
