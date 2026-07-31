import pytest
from app.models import Meeting, TranscriptChunk, Decision
from app.services.search import hybrid_search, search_decisions
from app.services.embeddings import DeterministicEmbeddings


@pytest.mark.asyncio
async def test_hybrid_search(async_session):
    m = Meeting(title="Database Architecture", raw_transcript="Sample")
    async_session.add(m)
    await async_session.commit()

    embedder = DeterministicEmbeddings(768)
    chunk1 = TranscriptChunk(
        meeting_id=m.id,
        speaker="Sarah",
        content="Postgres with pgvector handles vector search seamlessly.",
        chunk_index=0,
        embedding=embedder.embed_query("Postgres with pgvector handles vector search seamlessly."),
    )
    chunk2 = TranscriptChunk(
        meeting_id=m.id,
        speaker="Omar",
        content="Frontend will use Next.js App Router.",
        chunk_index=1,
        embedding=embedder.embed_query("Frontend will use Next.js App Router."),
    )
    async_session.add_all([chunk1, chunk2])
    await async_session.commit()

    results = await hybrid_search(
        query="Postgres vector search",
        session=async_session,
        embedder=embedder,
    )
    assert len(results) >= 1
    assert "pgvector" in results[0].content


@pytest.mark.asyncio
async def test_search_decisions(async_session):
    m = Meeting(title="API Specs", raw_transcript="Sample")
    async_session.add(m)
    await async_session.commit()

    d1 = Decision(
        meeting_id=m.id,
        content="Adopt GraphQL for client queries",
        source_quote="Adopt GraphQL",
        transcript_position=0,
    )
    async_session.add(d1)
    await async_session.commit()

    embedder = DeterministicEmbeddings(768)
    dec_results = await search_decisions(
        query="GraphQL vs REST API",
        session=async_session,
        embedder=embedder,
    )
    assert len(dec_results) == 1
    assert "GraphQL" in dec_results[0]["content"]
