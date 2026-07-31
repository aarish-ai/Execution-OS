import asyncio
from datetime import datetime, date, timedelta
from sqlalchemy import select

from app.workers.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.models import Task, TaskStatus, Topic, Decision, DriftAlert, WeeklyBrief
from app.services.brief import generate_weekly_brief_service


def run_async(coro):
    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            raise RuntimeError
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


@celery_app.task
def generate_weekly_brief_task():
    async def _async_gen():
        async with AsyncSessionLocal() as session:
            content = await generate_weekly_brief_service(session=session)
            today = date.today()
            week_start = today - timedelta(days=today.weekday())
            week_end = week_start + timedelta(days=6)
            brief = WeeklyBrief(content=content, week_start=week_start, week_end=week_end)
            session.add(brief)
            await session.commit()
            return str(brief.id)

    return run_async(_async_gen())


@celery_app.task
def check_drift_task():
    async def _async_drift():
        async with AsyncSessionLocal() as session:
            topics_res = await session.execute(select(Topic))
            topics = topics_res.scalars().all()

            topic_map = {}
            for t in topics:
                if t.name not in topic_map:
                    topic_map[t.name] = {"count": 0, "topic_id": t.id}
                topic_map[t.name]["count"] += 1

            for name, info in topic_map.items():
                if info["count"] >= 3:
                    # Check if decision exists for this topic
                    dec_res = await session.execute(
                        select(Decision).join(Topic).where(Topic.name == name)
                    )
                    if not dec_res.scalars().first():
                        drift = DriftAlert(
                            topic_name=name,
                            topic_id=info["topic_id"],
                            meeting_count=info["count"],
                            last_seen=datetime.utcnow(),
                        )
                        session.add(drift)

            await session.commit()

    return run_async(_async_drift())


@celery_app.task
def mark_overdue_tasks_task():
    async def _async_overdue():
        async with AsyncSessionLocal() as session:
            today = date.today()
            stmt = select(Task).where(
                Task.deadline < today,
                Task.status.in_([TaskStatus.OPEN, TaskStatus.IN_PROGRESS])
            )
            res = await session.execute(stmt)
            tasks = res.scalars().all()
            for t in tasks:
                t.status = TaskStatus.OVERDUE
            await session.commit()
            return len(tasks)

    return run_async(_async_overdue())
