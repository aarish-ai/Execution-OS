import logging
logger = logging.getLogger(__name__)

import json
import re
from typing import Dict, Any
from langchain_core.messages import HumanMessage

from app.pipelines.state import MeetingState
from app.pipelines.prompts import EXTRACTION_PROMPT, REPAIR_EXTRACTION_PROMPT
from app.services.llm import get_llm


def compute_health_score(extraction: Dict[str, Any]) -> float:
    decisions = extraction.get("decisions", [])
    tasks = extraction.get("tasks", [])
    questions = extraction.get("open_questions", [])
    topics = extraction.get("topics", [])

    d_score = 0.4 * min(len(decisions) / 2.0, 1.0)
    t_score = 0.3 * min(len([t for t in tasks if t.get("owner")]) / 2.0, 1.0)
    q_score = 0.2 * min(len(questions) / 2.0, 1.0)
    top_score = 0.1 * min(len(topics) / 2.0, 1.0)

    return round(d_score + t_score + q_score + top_score, 2)


async def extract_node(state: MeetingState, llm=None) -> dict:
    errors = list(state.get("errors", []))
    chunks = state.get("chunks", [])

    formatted_transcript = "\n".join(
        f"[Chunk {c['chunk_index']}] {c['speaker'] or 'Speaker'}: {c['content']}"
        for c in chunks
    )

    if llm is None:
        llm = get_llm()

    extraction: Dict[str, Any] = {
        "decisions": [],
        "tasks": [],
        "open_questions": [],
        "topics": [],
    }

    try:
        prompt_text = EXTRACTION_PROMPT.format(transcript_text=formatted_transcript)
        response = await llm.ainvoke([HumanMessage(content=prompt_text)])
        response_text = response.content if hasattr(response, "content") else str(response)

        json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
        raw_json = json_match.group(0) if json_match else response_text

        try:
            extraction = json.loads(raw_json)
        except Exception as json_err:
            # Repair prompt retry
            repair_prompt = REPAIR_EXTRACTION_PROMPT.format(
                error_msg=str(json_err), malformed_json=raw_json
            )
            repair_res = await llm.ainvoke([HumanMessage(content=repair_prompt)])
            repair_text = repair_res.content if hasattr(repair_res, "content") else str(repair_res)
            r_match = re.search(r"\{.*\}", repair_text, re.DOTALL)
            extraction = json.loads(r_match.group(0) if r_match else repair_text)

    except Exception as e:
        logger.error(f"Pipeline error in extract.py: {e}", exc_info=True)
        errors.append(f"Extract node error: {str(e)}")

    health_score = compute_health_score(extraction)

    return {
        "extraction": extraction,
        "health_score": health_score,
        "errors": errors,
    }
