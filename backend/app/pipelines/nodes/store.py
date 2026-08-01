import logging
logger = logging.getLogger(__name__)

import uuid
from datetime import date
from sqlalchemy import select

from app.pipelines.state import MeetingState
from app.services.embeddings import get_embedder
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models import (
    Meeting,
    Topic,
    Decision,
    Task,
    TaskStatus,
    OpenQuestion,
    TranscriptChunk,
    ContradictionAlert,
)


async def store_node(state: MeetingState, session=None, embedder=None) -> dict:
    errors = list(state.get("errors", []))
    meeting_id = state.get("meeting_id")
    chunks = state.get("chunks", [])
    extraction = state.get("extraction", {})
    summary = state.get("summary", "")
    health_score = state.get("health_score", 0.0)
    alerts = state.get("contradiction_alerts", [])

    if embedder is None:
        embedder = get_embedder()

    try:
        should_close = False
        if session is None:
            session = AsyncSessionLocal()
            should_close = True

        try:
            m_uuid = uuid.UUID(meeting_id) if isinstance(meeting_id, str) else meeting_id

            res = await session.execute(select(Meeting).where(Meeting.id == m_uuid))
            meeting = res.scalars().first()

            if not meeting:
                meeting = Meeting(
                    id=m_uuid,
                    title=state.get("title", "Untitled Meeting"),
                    raw_transcript=state.get("raw_transcript", ""),
                )
                session.add(meeting)

            meeting.summary = summary
            meeting.health_score = health_score

            # Batch embed transcript chunks
            contents = [c["content"] for c in chunks]
            embeddings = embedder.embed_documents(contents) if contents else []

            for i, c in enumerate(chunks):
                emb = embeddings[i] if i < len(embeddings) else [0.0] * settings.EMBEDDING_DIMENSION
                t_chunk = TranscriptChunk(
                    meeting_id=meeting.id,
                    speaker=c.get("speaker"),
                    content=c["content"],
                    chunk_index=c.get("chunk_index", i),
                    embedding=emb,
                )
                session.add(t_chunk)

            # Store topics
            topic_obj_map = {}
            for top_name in extraction.get("topics", []):
                t_emb = embedder.embed_query(top_name)
                top_obj = Topic(
                    meeting_id=meeting.id,
                    name=top_name,
                    embedding=t_emb,
                )
                session.add(top_obj)
                await session.flush()
                topic_obj_map[top_name] = top_obj.id

            # Store decisions with embeddings
            for d in extraction.get("decisions", []):
                top_id = topic_obj_map.get(d.get("topic"))
                d_emb = embedder.embed_query(d["content"])
                dec_obj = Decision(
                    meeting_id=meeting.id,
                    topic_id=top_id,
                    content=d["content"],
                    owner=d.get("owner"),
                    rationale=d.get("rationale"),
                    source_quote=d.get("source_quote", d["content"]),
                    transcript_position=d.get("chunk_index", 0),
                    embedding=d_emb,
                )
                session.add(dec_obj)

            # Store tasks
            for t in extraction.get("tasks", []):
                d_val = None
                if t.get("deadline") and isinstance(t["deadline"], str) and len(t["deadline"]) == 10:
                    try:
                        d_val = date.fromisoformat(t["deadline"])
                    except ValueError:
                        d_val = None

                st_val = TaskStatus.OPEN
                if t.get("status") and str(t["status"]).lower() in TaskStatus.__members__.values():
                    st_val = TaskStatus(str(t["status"]).lower())

                task_obj = Task(
                    meeting_id=meeting.id,
                    owner=t.get("owner", "Unassigned"),
                    description=t["description"],
                    deadline=d_val,
                    status=st_val,
                    source_quote=t.get("source_quote", t["description"]),
                    transcript_position=t.get("chunk_index", 0),
                )
                session.add(task_obj)

            # Store open questions with transcript_position
            for q in extraction.get("open_questions", []):
                q_obj = OpenQuestion(
                    meeting_id=meeting.id,
                    content=q["content"],
                    raised_by=q.get("raised_by"),
                    transcript_position=q.get("chunk_index", 0),
                )
                session.add(q_obj)

            # Store contradiction alerts
            for a in alerts:
                if a.get("prior_decision_id"):
                    c_alert = ContradictionAlert(
                        meeting_id=meeting.id,
                        prior_decision_id=uuid.UUID(a["prior_decision_id"]),
                        conflicting_quote=a.get("conflicting_quote", ""),
                        explanation=a.get("explanation", ""),
                    )
                    session.add(c_alert)

            await session.commit()

        finally:
            if should_close:
                await session.close()

    except Exception as e:
        logger.error(f"Pipeline error in store.py: {e}", exc_info=True)
        errors.append(f"Store node error: {str(e)}")

    return {
        "errors": errors,
    }
