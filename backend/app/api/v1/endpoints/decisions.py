import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.utils import sanitize_like_pattern
from app.models.decision import Decision
from app.schemas import DecisionSchema

router = APIRouter()


@router.get("", response_model=List[DecisionSchema])
async def list_decisions(
    owner: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Decision)
    if owner:
        safe_owner = sanitize_like_pattern(owner)
        stmt = stmt.where(Decision.owner.ilike(f"%{safe_owner}%"))
    res = await db.execute(stmt.order_by(Decision.created_at.desc()))
    return res.scalars().all()


@router.get("/{decision_id}", response_model=DecisionSchema)
async def get_decision(decision_id: str, db: AsyncSession = Depends(get_db)):
    try:
        d_uuid = uuid.UUID(decision_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid decision UUID")

    res = await db.execute(select(Decision).where(Decision.id == d_uuid))
    decision = res.scalars().first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision
