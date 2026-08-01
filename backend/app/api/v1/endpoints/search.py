from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_core.messages import HumanMessage

from app.core.database import get_db
from app.schemas import SearchQuery, AskQuery, AskResponse, AskSource
from app.services.search import hybrid_search, SearchResult
from app.services.llm import get_llm

router = APIRouter()


@router.post("", response_model=List[SearchResult])
async def search_transcript(
    payload: SearchQuery,
    db: AsyncSession = Depends(get_db),
):
    results = await hybrid_search(
        query=payload.query,
        meeting_id=payload.meeting_id,
        top_k=payload.top_k,
        session=db,
    )
    return results


@router.post("/ask", response_model=AskResponse)
async def ask_anything(
    payload: AskQuery,
    db: AsyncSession = Depends(get_db),
):
    search_res = await hybrid_search(query=payload.question, top_k=5, session=db)

    sources = [
        AskSource(
            meeting_id=r.meeting_id,
            meeting_title=r.meeting_title,
            chunk_index=r.chunk_index,
            speaker=r.speaker,
            content=r.content,
        )
        for r in search_res
    ]

    excerpts = "\n\n".join(
        f"Excerpt from '{r.meeting_title}' (Speaker: {r.speaker or 'Unknown'}, Chunk {r.chunk_index}):\n{r.content}"
        for r in search_res
    )

    prompt = f"""You are AI Execution OS, an organizational memory system for team leads.
Answer the question based strictly on the following meeting excerpts.
Cite the source meeting titles and speakers in your answer text where applicable.

Question: {payload.question}

Meeting Excerpts:
{excerpts or 'No matching excerpts found.'}
"""

    llm = get_llm()
    try:
        res = await llm.ainvoke([HumanMessage(content=prompt)])
        answer = res.content if hasattr(res, "content") else str(res)
    except Exception as e:
        answer = f"Could not generate LLM response: {str(e)}"

    return AskResponse(answer=answer, sources=sources)
