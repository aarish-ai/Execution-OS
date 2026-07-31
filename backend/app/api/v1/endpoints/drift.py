import uuid
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.drift_alert import DriftAlert

router = APIRouter()


class DriftAlertResponse(BaseModel):
    id: str
    topic_name: str
    topic_id: Optional[str]
    meeting_count: int
    resolved: bool
    last_seen: datetime
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/", response_model=List[DriftAlertResponse])
async def list_drift_alerts(
    unresolved_only: bool = True,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(DriftAlert)
    if unresolved_only:
        stmt = stmt.where(DriftAlert.resolved == False)
    res = await db.execute(stmt.order_by(DriftAlert.created_at.desc()))
    alerts = res.scalars().all()
    return [
        DriftAlertResponse(
            id=str(a.id),
            topic_name=a.topic_name,
            topic_id=str(a.topic_id) if a.topic_id else None,
            meeting_count=a.meeting_count,
            resolved=a.resolved,
            last_seen=a.last_seen,
            created_at=a.created_at,
        )
        for a in alerts
    ]


@router.patch("/{drift_id}/resolve")
async def resolve_drift_alert(drift_id: str, db: AsyncSession = Depends(get_db)):
    try:
        d_uuid = uuid.UUID(drift_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    res = await db.execute(select(DriftAlert).where(DriftAlert.id == d_uuid))
    alert = res.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Drift alert not found")

    alert.resolved = True
    await db.commit()
    return {"status": "success", "id": drift_id, "resolved": True}
