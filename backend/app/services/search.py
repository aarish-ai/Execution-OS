import math
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import TranscriptChunk, Meeting, Decision
from app.services.embeddings import get_embedder
from app.core.database import AsyncSessionLocal


class SearchResult(BaseModel):
    chunk_id: str
    meeting_id: str
    meeting_title: str
    speaker: Optional[str] = None
    content: str
    chunk_index: int
    score: float



def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)


async def hybrid_search(
    query: str,
    top_k: int = 5,
    session: Optional[AsyncSession] = None,
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

        # 1. Semantic Search using pgvector distance operator when available
        semantic_results = []
        try:
            stmt = (
                select(TranscriptChunk, Meeting.title)
                .join(Meeting, TranscriptChunk.meeting_id == Meeting.id)
                .order_by(TranscriptChunk.embedding.cosine_distance(query_vec))
                .limit(top_k * 2)
            )
            res = await session.execute(stmt)
            for chunk, m_title in res.all():
                c_emb = chunk.embedding if isinstance(chunk.embedding, list) else list(chunk.embedding)
                score = cosine_similarity(query_vec, c_emb)
                semantic_results.append((chunk, m_title, score))
        except Exception:
            # Fallback for SQLite in-memory unit tests
            stmt = select(TranscriptChunk, Meeting.title).join(
                Meeting, TranscriptChunk.meeting_id == Meeting.id
            )
            res = await session.execute(stmt)
            for chunk, m_title in res.all():
                c_emb = chunk.embedding if isinstance(chunk.embedding, list) else list(chunk.embedding)
                score = cosine_similarity(query_vec, c_emb)
                semantic_results.append((chunk, m_title, score))

            semantic_results.sort(key=lambda x: x[2], reverse=True)
            semantic_results = semantic_results[: top_k * 2]

        # 2. Postgres FTS / Keyword Search
        keyword_results = []
        try:
            fts_stmt = (
                select(TranscriptChunk, Meeting.title)
                .join(Meeting, TranscriptChunk.meeting_id == Meeting.id)
                .where(func.to_tsvector("english", TranscriptChunk.content).match(query))
                .limit(top_k * 2)
            )
            fts_res = await session.execute(fts_stmt)
            for chunk, m_title in fts_res.all():
                keyword_results.append((chunk, m_title))
        except Exception:
            # Basic keyword match fallback
            kw_stmt = (
                select(TranscriptChunk, Meeting.title)
                .join(Meeting, TranscriptChunk.meeting_id == Meeting.id)
                .where(TranscriptChunk.content.ilike(f"%{query}%"))
                .limit(top_k * 2)
            )
            kw_res = await session.execute(kw_stmt)
            for chunk, m_title in kw_res.all():
                keyword_results.append((chunk, m_title))

        # 3. Reciprocal Rank Fusion (RRF)
        rrf_scores: Dict[str, Dict[str, Any]] = {}
        k_const = 60

        for rank, (chunk, m_title, sem_score) in enumerate(semantic_results):
            cid = str(chunk.id)
            if cid not in rrf_scores:
                rrf_scores[cid] = {"chunk": chunk, "meeting_title": m_title, "score": 0.0}
            rrf_scores[cid]["score"] += 1.0 / (k_const + rank + 1)

        for rank, (chunk, m_title) in enumerate(keyword_results):
            cid = str(chunk.id)
            if cid not in rrf_scores:
                rrf_scores[cid] = {"chunk": chunk, "meeting_title": m_title, "score": 0.0}
            rrf_scores[cid]["score"] += 1.0 / (k_const + rank + 1)

        fused = list(rrf_scores.values())
        fused.sort(key=lambda x: x["score"], reverse=True)
        top_candidates = fused[:top_k]

        # 4. Optional Cross-Encoder Reranking
        final_results = []
        try:
            from sentence_transformers import CrossEncoder
            reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
            pairs = [(query, item["chunk"].content) for item in top_candidates]
            ce_scores = reranker.predict(pairs)

            for idx, item in enumerate(top_candidates):
                final_results.append({
                    "chunk_id": str(item["chunk"].id),
                    "meeting_id": str(item["chunk"].meeting_id),
                    "meeting_title": item["meeting_title"],
                    "speaker": item["chunk"].speaker,
                    "content": item["chunk"].content,
                    "chunk_index": item["chunk"].chunk_index,
                    "score": float(ce_scores[idx]),
                })
            final_results.sort(key=lambda x: x["score"], reverse=True)
        except Exception:
            for item in top_candidates:
                final_results.append({
                    "chunk_id": str(item["chunk"].id),
                    "meeting_id": str(item["chunk"].meeting_id),
                    "meeting_title": item["meeting_title"],
                    "speaker": item["chunk"].speaker,
                    "content": item["chunk"].content,
                    "chunk_index": item["chunk"].chunk_index,
                    "score": item["score"],
                })

        return final_results[:top_k]

    finally:
        if should_close:
            await session.close()


async def search_decisions(
    query: str,
    top_k: int = 5,
    session: Optional[AsyncSession] = None,
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
        scored_decisions = []

        try:
            stmt = (
                select(Decision)
                .order_by(Decision.embedding.cosine_distance(query_vec))
                .limit(top_k)
            )
            res = await session.execute(stmt)
            decisions = res.scalars().all()
            for d in decisions:
                d_emb = d.embedding if isinstance(d.embedding, list) else list(d.embedding) if d.embedding is not None else []
                score = cosine_similarity(query_vec, d_emb) if d_emb else 0.5
                scored_decisions.append({
                    "id": str(d.id),
                    "meeting_id": str(d.meeting_id),
                    "content": d.content,
                    "owner": d.owner,
                    "score": score,
                })
        except Exception:
            res = await session.execute(select(Decision))
            decisions = res.scalars().all()
            for d in decisions:
                if d.embedding is not None:
                    d_emb = d.embedding if isinstance(d.embedding, list) else list(d.embedding)
                else:
                    d_emb = embedder.embed_query(d.content)
                score = cosine_similarity(query_vec, d_emb)
                scored_decisions.append({
                    "id": str(d.id),
                    "meeting_id": str(d.meeting_id),
                    "content": d.content,
                    "owner": d.owner,
                    "score": score,
                })
            scored_decisions.sort(key=lambda x: x["score"], reverse=True)

        return scored_decisions[:top_k]

    finally:
        if should_close:
            await session.close()
