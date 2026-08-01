import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.contradiction_alert import ContradictionAlert
from app.schemas import ContradictionAlertSchema

router = APIRouter()


@router.get("", response_model=List[ContradictionAlertSchema])
async def list_contradictions(
    include_dismissed: bool = False,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ContradictionAlert)
    if not include_dismissed:
        stmt = stmt.where(ContradictionAlert.dismissed == False)
    res = await db.execute(stmt.order_by(ContradictionAlert.created_at.desc()))
    return res.scalars().all()


@router.patch("/{contradiction_id}/dismiss")
async def dismiss_contradiction(contradiction_id: str, db: AsyncSession = Depends(get_db)):
    try:
        c_uuid = uuid.UUID(contradiction_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    res = await db.execute(select(ContradictionAlert).where(ContradictionAlert.id == c_uuid))
    c_alert = res.scalars().first()
    if not c_alert:
        raise HTTPException(status_code=404, detail="Contradiction alert not found")

    c_alert.dismissed = True
    await db.commit()
    return {"status": "success", "id": contradiction_id, "dismissed": True}
