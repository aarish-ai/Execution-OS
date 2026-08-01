import logging
logger = logging.getLogger(__name__)

import json
import re
from typing import List, Dict, Any
from langchain_core.messages import HumanMessage

from app.pipelines.state import MeetingState
from app.pipelines.prompts import CONTRADICTION_PROMPT
from app.services.llm import get_llm
from app.services.search import search_decisions
from app.core.database import AsyncSessionLocal


async def contradiction_node(state: MeetingState, llm=None, session=None, embedder=None) -> dict:
    errors = list(state.get("errors", []))
    extraction = state.get("extraction", {})
    decisions = extraction.get("decisions", [])
    alerts: List[Dict[str, Any]] = []

    if not decisions:
        return {"contradiction_alerts": alerts, "errors": errors}

    if llm is None:
        llm = get_llm()

    try:
        should_close = False
        if session is None:
            session = AsyncSessionLocal()
            should_close = True

        try:
            for d in decisions:
                new_content = d.get("content", "")
                if not new_content:
                    continue

                # Optimize: retrieve top 5 semantically similar prior decisions via vector search
                prior_results = await search_decisions(query=new_content, top_k=5, session=session, embedder=embedder)

                for prior in prior_results:
                    # Skip if same meeting
                    if prior.get("meeting_id") == state.get("meeting_id"):
                        continue

                    prompt = CONTRADICTION_PROMPT.format(
                        new_decision=new_content, prior_decision=prior["content"]
                    )
                    response = await llm.ainvoke([HumanMessage(content=prompt)])
                    resp_text = response.content if hasattr(response, "content") else str(response)

                    match = re.search(r"\{.*\}", resp_text, re.DOTALL)
                    if match:
                        try:
                            parsed = json.loads(match.group(0))
                            if parsed.get("contradicts"):
                                alerts.append({
                                    "prior_decision_id": str(prior["id"]),
                                    "conflicting_quote": d.get("source_quote", new_content),
                                    "explanation": parsed.get("explanation", "Contradiction detected with prior decision."),
                                    "chunk_index": d.get("chunk_index", 0),
                                })
                        except Exception:
                            pass
        finally:
            if should_close:
                await session.close()

    except Exception as e:
        logger.error(f"Pipeline error in contradiction.py: {e}", exc_info=True)
        errors.append(f"Contradiction node error: {str(e)}")

    return {
        "contradiction_alerts": alerts,
        "errors": errors,
    }
