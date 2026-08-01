import uuid
import os
import logging
from typing import Dict, Any, Optional
from langgraph.graph import StateGraph, END

from app.core.config import settings
from app.pipelines.state import MeetingState
from app.pipelines.nodes.ingest import ingest_node
from app.pipelines.nodes.parse import parse_node
from app.pipelines.nodes.extract import extract_node
from app.pipelines.nodes.link import link_node
from app.pipelines.nodes.contradiction import contradiction_node
from app.pipelines.nodes.summarize import summarize_node
from app.pipelines.nodes.brief import brief_node
from app.pipelines.nodes.task_sync import task_sync_node
from app.pipelines.nodes.store import store_node

logger = logging.getLogger("execution_os.pipeline")

if settings.LANGSMITH_API_KEY:
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_API_KEY"] = settings.LANGSMITH_API_KEY
    os.environ["LANGCHAIN_PROJECT"] = settings.LANGSMITH_PROJECT


async def error_handler_node(state: MeetingState) -> dict:
    logger.error(f"Pipeline encountered critical errors: {state.get('errors')}")
    return {"errors": state.get("errors", [])}


def should_continue(state: MeetingState) -> str:
    critical_errors = [e for e in state.get("errors", []) if "error" in e.lower() or "empty" in e.lower()]
    if critical_errors:
        return "error_handler"
    return "link"


def build_graph(llm=None, session=None, embedder=None):
    workflow = StateGraph(MeetingState)

    workflow.add_node("ingest", ingest_node)
    workflow.add_node("parse", parse_node)
    
    from functools import partial
    workflow.add_node("extract", partial(extract_node, llm=llm))
    workflow.add_node("link", partial(link_node, session=session))
    workflow.add_node("contradiction", partial(contradiction_node, llm=llm, session=session, embedder=embedder))
    workflow.add_node("summarize", partial(summarize_node, llm=llm))
    workflow.add_node("brief", partial(brief_node, llm=llm, session=session))
    workflow.add_node("task_sync", partial(task_sync_node, session=session))
    workflow.add_node("store", partial(store_node, session=session, embedder=embedder))
    workflow.add_node("error_handler", error_handler_node)

    workflow.set_entry_point("ingest")
    workflow.add_edge("ingest", "parse")
    workflow.add_edge("parse", "extract")

    workflow.add_conditional_edges(
        "extract",
        should_continue,
        {
            "link": "link",
            "error_handler": "error_handler",
        }
    )

    workflow.add_edge("link", "contradiction")
    workflow.add_edge("contradiction", "summarize")
    workflow.add_edge("summarize", "brief")
    workflow.add_edge("brief", "task_sync")
    workflow.add_edge("task_sync", "store")
    workflow.add_edge("store", END)
    workflow.add_edge("error_handler", "store")

    return workflow.compile()


async def run_pipeline(
    raw_transcript: str,
    meeting_id: Optional[str] = None,
    title: str = "Untitled Meeting",
    llm=None,
    session=None,
    embedder=None,
) -> Dict[str, Any]:
    if not meeting_id:
        meeting_id = str(uuid.uuid4())

    initial_state: MeetingState = {
        "raw_transcript": raw_transcript,
        "meeting_id": meeting_id,
        "title": title,
        "chunks": [],
        "extraction": {"decisions": [], "tasks": [], "open_questions": [], "topics": []},
        "summary": "",
        "health_score": 0.0,
        "contradiction_alerts": [],
        "brief": None,
        "errors": [],
    }

    graph = build_graph(llm=llm, session=session, embedder=embedder)
    final_state = await graph.ainvoke(initial_state)
    return final_state
