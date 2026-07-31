import uuid
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.utils import sanitize_like_pattern
from app.models.task import Task, TaskStatus
from app.schemas import TaskSchema, TaskUpdate

router = APIRouter()


@router.get("/", response_model=List[TaskSchema])
async def list_tasks(
    owner: Optional[str] = None,
    status: Optional[TaskStatus] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Task)
    if owner:
        safe_owner = sanitize_like_pattern(owner)
        stmt = stmt.where(Task.owner.ilike(f"%{safe_owner}%"))
    if status:
        stmt = stmt.where(Task.status == status)
    res = await db.execute(stmt.order_by(Task.created_at.desc()))
    return res.scalars().all()


@router.get("/overdue", response_model=List[TaskSchema])
async def list_overdue_tasks(db: AsyncSession = Depends(get_db)):
    today = date.today()
    stmt = select(Task).where(
        Task.deadline < today,
        Task.status != TaskStatus.DONE
    )
    res = await db.execute(stmt)
    return res.scalars().all()


@router.patch("/{task_id}", response_model=TaskSchema)
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    db: AsyncSession = Depends(get_db),
):
    try:
        t_uuid = uuid.UUID(task_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task UUID")

    res = await db.execute(select(Task).where(Task.id == t_uuid))
    task = res.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if payload.status is not None:
        task.status = payload.status
    if payload.deadline is not None:
        task.deadline = payload.deadline

    await db.commit()
    await db.refresh(task)
    return task
