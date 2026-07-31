from typing import Dict, Any
from sqlalchemy import select
from app.pipelines.state import MeetingState
from app.core.database import AsyncSessionLocal
from app.models.topic import Topic


async def link_node(state: MeetingState, session=None) -> dict:
    errors = list(state.get("errors", []))
    extraction = state.get("extraction", {})
    topics = extraction.get("topics", [])

    topic_mappings: Dict[str, str] = {}

    try:
        should_close = False
        if session is None:
            session = AsyncSessionLocal()
            should_close = True

        try:
            for topic_name in topics:
                result = await session.execute(
                    select(Topic).where(Topic.name.ilike(f"%{topic_name}%")).limit(1)
                )
                existing = result.scalars().first()
                if existing:
                    topic_mappings[topic_name] = str(existing.id)
        finally:
            if should_close:
                await session.close()

    except Exception as e:
        errors.append(f"Link node error: {str(e)}")

    extraction["topic_mappings"] = topic_mappings

    return {
        "extraction": extraction,
        "errors": errors,
    }
