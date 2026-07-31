import asyncio
from datetime import datetime, date
from sqlalchemy import select

from app.workers.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.models import Task, TaskStatus, Topic, Decision, DriftAlert, WeeklyBrief
from app.services.brief import generate_weekly_brief_service


def run_async(coro):
    return asyncio.run(coro)


@celery_app.task
def generate_weekly_brief_task():
    async def _async_gen():
        async with AsyncSessionLocal() as session:
            content = await generate_weekly_brief_service(session=session)
            brief = WeeklyBrief(content=content)
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

            topic_counts = {}
            for t in topics:
                topic_counts[t.name] = topic_counts.get(t.name, 0) + 1

            for name, count in topic_counts.items():
                if count >= 3:
                    # Check if decision exists for this topic
                    dec_res = await session.execute(
                        select(Decision).join(Topic).where(Topic.name == name)
                    )
                    if not dec_res.scalars().first():
                        drift = DriftAlert(
                            topic_name=name,
                            meeting_count=count,
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
                Task.status == TaskStatus.OPEN
            )
            res = await session.execute(stmt)
            tasks = res.scalars().all()
            for t in tasks:
                t.status = TaskStatus.OVERDUE
            await session.commit()
            return len(tasks)

    return run_async(_async_overdue())
