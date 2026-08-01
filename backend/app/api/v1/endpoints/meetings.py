import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db, AsyncSessionLocal
from app.models import Meeting, Task, TaskStatus, OpenQuestion
from app.schemas import MeetingCreate, MeetingDetailSchema, MeetingSummarySchema
from app.pipelines.graph import run_pipeline

router = APIRouter()


async def _run_pipeline_background(raw_transcript: str, meeting_id: str, title: str):
    async with AsyncSessionLocal() as session:
        await run_pipeline(
            raw_transcript=raw_transcript,
            meeting_id=meeting_id,
            title=title,
            session=session,
        )


@router.post("", response_model=MeetingSummarySchema, status_code=status.HTTP_201_CREATED)
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

    background_tasks.add_task(_run_pipeline_background, payload.raw_transcript, meeting_id, payload.title)

    return MeetingSummarySchema(
        id=str(meeting.id),
        title=meeting.title,
        summary=meeting.summary,
        health_score=meeting.health_score,
        meeting_date=meeting.meeting_date,
        created_at=meeting.created_at,
        contradictions_count=0,
    )


@router.get("", response_model=List[MeetingSummarySchema])
async def list_meetings(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Meeting)
        .options(selectinload(Meeting.contradictions))
        .order_by(Meeting.created_at.desc())
    )
    meetings = res.scalars().all()
    summaries = []
    for m in meetings:
        c_count = len([c for c in m.contradictions if not c.dismissed]) if m.contradictions else 0
        summaries.append(
            MeetingSummarySchema(
                id=str(m.id),
                title=m.title,
                summary=m.summary,
                health_score=m.health_score,
                meeting_date=m.meeting_date,
                created_at=m.created_at,
                contradictions_count=c_count,
            )
        )
    return summaries


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
    # Context-aware pre-meeting brief: query open tasks and unresolved questions
    tasks_res = await db.execute(
        select(Task).where(Task.status.in_([TaskStatus.OPEN, TaskStatus.IN_PROGRESS]))
    )
    open_tasks = tasks_res.scalars().all()

    q_res = await db.execute(
        select(OpenQuestion).where(OpenQuestion.resolved == False)
    )
    unresolved_qs = q_res.scalars().all()

    brief_content = f"# Pre-Meeting Brief: {m.title}\n\n"
    brief_content += f"## Previous Meeting Summary\n{m.summary or 'No summary recorded yet.'}\n\n"
    brief_content += "## Open Action Items\n"
    if open_tasks:
        for t in open_tasks:
            brief_content += f"- **{t.owner}**: {t.description} (Status: {t.status.value})\n"
    else:
        brief_content += "No open action items.\n"

    brief_content += "\n## Unresolved Questions to Address\n"
    if unresolved_qs:
        for q in unresolved_qs:
            brief_content += f"- {q.content} (Raised by: {q.raised_by or 'Unknown'})\n"
    else:
        brief_content += "No open unresolved questions.\n"

    return {"brief": brief_content}


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
