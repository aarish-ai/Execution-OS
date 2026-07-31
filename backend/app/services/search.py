import math
import uuid
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy import select, or_

from app.core.database import AsyncSessionLocal
from app.models import TranscriptChunk, Decision, Meeting
from app.services.embeddings import get_embedder


class SearchResult(BaseModel):
    chunk_id: str
    meeting_id: str
    meeting_title: str
    speaker: Optional[str]
    content: str
    score: float
    chunk_index: int


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


async def hybrid_search(
    query: str,
    meeting_id: Optional[str] = None,
    top_k: int = 5,
    session=None,
    embedder=None,
) -> List[SearchResult]:
    if embedder is None:
        embedder = get_embedder()

    should_close = False
    if session is None:
        session = AsyncSessionLocal()
        should_close = True

    try:
        query_vec = embedder.embed_query(query)
        keywords = [k.lower() for k in query.split() if len(k) > 2]

        stmt = select(TranscriptChunk, Meeting.title).join(
            Meeting, TranscriptChunk.meeting_id == Meeting.id
        )
        if meeting_id:
            m_uuid = uuid.UUID(meeting_id) if isinstance(meeting_id, str) else meeting_id
            stmt = stmt.where(TranscriptChunk.meeting_id == m_uuid)

        res = await session.execute(stmt)
        rows = res.all()

        scored_results: List[SearchResult] = []

        for chunk, m_title in rows:
            # 1. Cosine similarity
            c_emb = chunk.embedding or []
            sem_score = cosine_similarity(query_vec, c_emb) if c_emb else 0.0

            # 2. Keyword match score
            content_lower = chunk.content.lower()
            kw_hits = sum(1 for kw in keywords if kw in content_lower)
            kw_score = min(kw_hits / max(len(keywords), 1), 1.0)

            # 3. Reciprocal Rank / Hybrid Combination
            combined_score = (sem_score * 0.7) + (kw_score * 0.3)

            scored_results.append(
                SearchResult(
                    chunk_id=str(chunk.id),
                    meeting_id=str(chunk.meeting_id),
                    meeting_title=m_title or "Untitled Meeting",
                    speaker=chunk.speaker,
                    content=chunk.content,
                    score=round(combined_score, 4),
                    chunk_index=chunk.chunk_index,
                )
            )

        scored_results.sort(key=lambda x: x.score, reverse=True)
        return scored_results[:top_k]

    finally:
        if should_close:
            await session.close()


async def search_decisions(
    query: str,
    top_k: int = 5,
    session=None,
    embedder=None,
) -> List[Dict[str, Any]]:
    if embedder is None:
        embedder = get_embedder()

    should_close = False
    if session is None:
        session = AsyncSessionLocal()
        should_close = True

    try:
        query_vec = embedder.embed_query(query)
        res = await session.execute(select(Decision))
        decisions = res.scalars().all()

        results = []
        for d in decisions:
            d_vec = embedder.embed_query(d.content)
            score = cosine_similarity(query_vec, d_vec)
            results.append({
                "id": str(d.id),
                "meeting_id": str(d.meeting_id),
                "content": d.content,
                "owner": d.owner,
                "score": round(score, 4),
            })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    finally:
        if should_close:
            await session.close()
