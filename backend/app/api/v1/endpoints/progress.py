from datetime import date
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_core.messages import HumanMessage

from app.core.database import get_db
from app.models.meeting import Meeting
from app.models.decision import Decision
from app.models.task import Task
from app.services.llm import get_llm

router = APIRouter()


class ProgressRequest(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProgressResponse(BaseModel):
    summary: str
    meetings_analyzed: int
    decisions_count: int
    tasks_count: int


@router.post("/", response_model=ProgressResponse)
async def generate_progress_summary(
    payload: ProgressRequest,
    db: AsyncSession = Depends(get_db),
):
    m_stmt = select(Meeting)
    d_stmt = select(Decision)
    t_stmt = select(Task)

    if payload.start_date:
        m_stmt = m_stmt.where(Meeting.created_at >= payload.start_date)
        d_stmt = d_stmt.where(Decision.created_at >= payload.start_date)
        t_stmt = t_stmt.where(Task.created_at >= payload.start_date)

    if payload.end_date:
        m_stmt = m_stmt.where(Meeting.created_at <= payload.end_date)
        d_stmt = d_stmt.where(Decision.created_at <= payload.end_date)
        t_stmt = t_stmt.where(Task.created_at <= payload.end_date)

    meetings = (await db.execute(m_stmt)).scalars().all()
    decisions = (await db.execute(d_stmt)).scalars().all()
    tasks = (await db.execute(t_stmt)).scalars().all()

    context = f"Meetings Analyzed: {len(meetings)}\n"
    context += "Decisions Made:\n" + "\n".join([f"- {d.content} (Owner: {d.owner})" for d in decisions]) + "\n"
    context += "Tasks:\n" + "\n".join([f"- [{t.status.value}] {t.description} (Owner: {t.owner})" for t in tasks])

    prompt = f"Synthesize a concise executive progress summary across the following execution records:\n\n{context}"

    llm = get_llm()
    resp = await llm.ainvoke([HumanMessage(content=prompt)])
    summary_text = resp.content if hasattr(resp, "content") else str(resp)

    return ProgressResponse(
        summary=summary_text,
        meetings_analyzed=len(meetings),
        decisions_count=len(decisions),
        tasks_count=len(tasks),
    )
