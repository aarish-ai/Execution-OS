import json
import re
from typing import List, Dict, Any
from langchain_core.messages import HumanMessage
from sqlalchemy import select

from app.pipelines.state import MeetingState
from app.pipelines.prompts import CONTRADICTION_PROMPT
from app.services.llm import get_llm
from app.core.database import AsyncSessionLocal
from app.models.decision import Decision


async def contradiction_node(state: MeetingState, llm=None, session=None) -> dict:
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
            # Query prior decisions from DB
            res = await session.execute(select(Decision).limit(50))
            prior_decisions = res.scalars().all()

            for d in decisions:
                new_content = d.get("content", "")
                if not new_content:
                    continue

                for prior in prior_decisions:
                    # Skip if same meeting
                    if str(prior.meeting_id) == state.get("meeting_id"):
                        continue

                    prompt = CONTRADICTION_PROMPT.format(
                        new_decision=new_content, prior_decision=prior.content
                    )
                    response = await llm.ainvoke([HumanMessage(content=prompt)])
                    resp_text = response.content if hasattr(response, "content") else str(response)

                    match = re.search(r"\{.*\}", resp_text, re.DOTALL)
                    if match:
                        try:
                            parsed = json.loads(match.group(0))
                            if parsed.get("contradicts"):
                                alerts.append({
                                    "prior_decision_id": str(prior.id),
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
        errors.append(f"Contradiction node error: {str(e)}")

    return {
        "contradiction_alerts": alerts,
        "errors": errors,
    }
