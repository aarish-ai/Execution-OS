import logging
logger = logging.getLogger(__name__)

from sqlalchemy import select
from langchain_core.messages import HumanMessage

from app.pipelines.state import MeetingState
from app.pipelines.prompts import PRE_MEETING_BRIEF_PROMPT
from app.services.llm import get_llm
from app.core.database import AsyncSessionLocal
from app.models.task import Task, TaskStatus
from app.models.question import OpenQuestion
from app.models.decision import Decision


async def brief_node(state: MeetingState, llm=None, session=None) -> dict:
    errors = list(state.get("errors", []))
    brief_text = ""

    if llm is None:
        llm = get_llm()

    try:
        should_close = False
        if session is None:
            session = AsyncSessionLocal()
            should_close = True

        try:
            tasks_res = await session.execute(select(Task).where(Task.status == TaskStatus.OPEN).limit(10))
            open_tasks = tasks_res.scalars().all()

            questions_res = await session.execute(select(OpenQuestion).where(OpenQuestion.resolved == False).limit(10))
            open_questions = questions_res.scalars().all()

            decisions_res = await session.execute(select(Decision).limit(5))
            recent_decisions = decisions_res.scalars().all()

            tasks_str = "\n".join(f"- {t.owner}: {t.description}" for t in open_tasks) or "None"
            questions_str = "\n".join(f"- {q.content}" for q in open_questions) or "None"
            decisions_str = "\n".join(f"- {d.content}" for d in recent_decisions) or "None"

            prompt = PRE_MEETING_BRIEF_PROMPT.format(
                tasks_text=tasks_str,
                questions_text=questions_str,
                decisions_text=decisions_str,
            )

            res = await llm.ainvoke([HumanMessage(content=prompt)])
            brief_text = res.content if hasattr(res, "content") else str(res)
        finally:
            if should_close:
                await session.close()

    except Exception as e:
        logger.error(f"Pipeline error in brief.py: {e}", exc_info=True)
        errors.append(f"Brief node error: {str(e)}")
        brief_text = "# Pre-Meeting Brief\n## Unresolved Questions\nNone\n## Open Tasks\nNone\n## Last Decided\nNone"

    return {
        "brief": brief_text,
        "errors": errors,
    }
