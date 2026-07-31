import json
from langchain_core.messages import HumanMessage
from app.pipelines.state import MeetingState
from app.pipelines.prompts import SUMMARIZATION_PROMPT
from app.services.llm import get_llm


async def summarize_node(state: MeetingState, llm=None) -> dict:
    errors = list(state.get("errors", []))
    chunks = state.get("chunks", [])
    extraction = state.get("extraction", {})

    if llm is None:
        llm = get_llm()

    summary = "Meeting summary not available."

    try:
        formatted_transcript = "\n".join(
            f"{c['speaker'] or 'Speaker'}: {c['content']}" for c in chunks
        )
        prompt = SUMMARIZATION_PROMPT.format(
            extraction_json=json.dumps(extraction, indent=2),
            transcript_text=formatted_transcript,
        )
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        summary = response.content if hasattr(response, "content") else str(response)
    except Exception as e:
        errors.append(f"Summarize node error: {str(e)}")

    return {
        "summary": summary,
        "errors": errors,
    }
