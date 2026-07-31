import os
from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "execution_os_workers",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "weekly-brief-every-monday": {
            "task": "app.workers.tasks.generate_weekly_brief_task",
            "schedule": crontab(day_of_week="monday", hour=7, minute=0),
        },
        "check-drift-every-friday": {
            "task": "app.workers.tasks.check_drift_task",
            "schedule": crontab(day_of_week="friday", hour=17, minute=0),
        },
        "mark-overdue-tasks-daily": {
            "task": "app.workers.tasks.mark_overdue_tasks_task",
            "schedule": crontab(hour=0, minute=1),
        },
    },
)
