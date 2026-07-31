from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.weekly_brief import WeeklyBrief
from app.services.brief import generate_weekly_brief_service

router = APIRouter()


@router.get("/weekly")
async def get_weekly_brief(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(WeeklyBrief).order_by(WeeklyBrief.created_at.desc()).limit(1))
    latest = res.scalars().first()
    if not latest:
        return {"content": "# Weekly Execution Brief\nNo weekly brief generated yet. Click 'Generate' to create one."}
    return {"id": str(latest.id), "content": latest.content, "created_at": latest.created_at}


@router.post("/weekly/generate")
async def generate_weekly_brief(db: AsyncSession = Depends(get_db)):
    content = await generate_weekly_brief_service(session=db)
    brief = WeeklyBrief(content=content)
    db.add(brief)
    await db.commit()
    await db.refresh(brief)
    return {"id": str(brief.id), "content": brief.content, "created_at": brief.created_at}
