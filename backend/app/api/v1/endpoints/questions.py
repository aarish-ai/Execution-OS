import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.question import OpenQuestion
from app.schemas import OpenQuestionSchema

router = APIRouter()


@router.get("", response_model=List[OpenQuestionSchema])
async def list_questions(
    unresolved_only: bool = True,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(OpenQuestion)
    if unresolved_only:
        stmt = stmt.where(OpenQuestion.resolved == False)
    res = await db.execute(stmt.order_by(OpenQuestion.created_at.desc()))
    return res.scalars().all()


@router.patch("/{question_id}/resolve")
async def resolve_question(question_id: str, db: AsyncSession = Depends(get_db)):
    try:
        q_uuid = uuid.UUID(question_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    res = await db.execute(select(OpenQuestion).where(OpenQuestion.id == q_uuid))
    question = res.scalars().first()
    if not question:
        raise HTTPException(status_code=404, detail="Open question not found")

    question.resolved = True
    await db.commit()
    return {"status": "success", "id": question_id, "resolved": True}
