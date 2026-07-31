from datetime import datetime, timedelta
from sqlalchemy import select
from langchain_core.messages import HumanMessage

from app.core.database import AsyncSessionLocal
from app.models import Decision, Task, OpenQuestion, ContradictionAlert, TaskStatus
from app.services.llm import get_llm


async def generate_weekly_brief_service(session=None) -> str:
    should_close = False
    if session is None:
        session = AsyncSessionLocal()
        should_close = True

    try:
        cutoff = datetime.utcnow() - timedelta(days=7)

        d_res = await session.execute(select(Decision).where(Decision.created_at >= cutoff))
        recent_decisions = d_res.scalars().all()

        t_res = await session.execute(select(Task).where(Task.status.in_([TaskStatus.OPEN, TaskStatus.OVERDUE])))
        open_tasks = t_res.scalars().all()

        q_res = await session.execute(select(OpenQuestion).where(OpenQuestion.resolved == False))
        open_questions = q_res.scalars().all()

        c_res = await session.execute(select(ContradictionAlert).where(ContradictionAlert.created_at >= cutoff))
        recent_contradictions = c_res.scalars().all()

        decisions_str = "\n".join(f"- {d.content} (Owner: {d.owner or 'Team'})" for d in recent_decisions) or "None"
        tasks_str = "\n".join(f"- {t.owner}: {t.description} [Status: {t.status.value}]" for t in open_tasks) or "None"
        questions_str = "\n".join(f"- {q.content}" for q in open_questions) or "None"
        contradictions_str = "\n".join(f"- {c.explanation}" for c in recent_contradictions) or "None"

        prompt = f"""Generate a Weekly Execution Brief in clean markdown for a Team Lead based on this week's data.

Data:
### Decided This Week:
{decisions_str}

### Open & Overdue Tasks:
{tasks_str}

### Unresolved Questions:
{questions_str}

### Contradiction Alerts:
{contradictions_str}

Format output as:
# Weekly Execution Brief — {datetime.utcnow().strftime('%B %d, %Y')}
## What Got Decided
## Who Owns What
## Still Unresolved
## Drift & Contradiction Flags
"""

        llm = get_llm()
        res = await llm.ainvoke([HumanMessage(content=prompt)])
        return res.content if hasattr(res, "content") else str(res)

    finally:
        if should_close:
            await session.close()
