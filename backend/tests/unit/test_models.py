import pytest
from datetime import datetime, date
from app.models import Meeting, Task, TaskStatus, Decision, OpenQuestion


@pytest.mark.asyncio
async def test_create_meeting_and_related_records(async_session):
    meeting = Meeting(
        title="Sprint Planning",
        raw_transcript="Ahmed: Let's build the DB.",
        health_score=0.8,
    )
    async_session.add(meeting)
    await async_session.commit()
    await async_session.refresh(meeting)

    assert meeting.id is not None
    assert meeting.title == "Sprint Planning"

    task = Task(
        meeting_id=meeting.id,
        owner="Omar",
        description="Setup DB schema",
        deadline=date(2026, 8, 5),
        status=TaskStatus.OPEN,
        source_quote="Omar: I'll have it done by Thursday.",
        transcript_position=1,
    )
    decision = Decision(
        meeting_id=meeting.id,
        content="Use Postgres with pgvector",
        source_quote="Ahmed: Let me decide on Postgres.",
        transcript_position=0,
    )
    question = OpenQuestion(
        meeting_id=meeting.id,
        content="Do we need separate vector index?",
        raised_by="Ahmed",
    )

    async_session.add_all([task, decision, question])
    await async_session.commit()

    await async_session.refresh(task)
    assert task.id is not None
    assert task.status == TaskStatus.OPEN
    assert decision.content == "Use Postgres with pgvector"
    assert question.resolved is False
