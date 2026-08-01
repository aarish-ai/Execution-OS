import logging
logger = logging.getLogger(__name__)

from datetime import date
from typing import Dict, Any, List
from app.pipelines.state import MeetingState


async def task_sync_node(state: MeetingState, session=None) -> dict:
    errors = list(state.get("errors", []))
    extraction = state.get("extraction", {})
    tasks: List[Dict[str, Any]] = extraction.get("tasks", [])

    normalized_tasks = []
    seen_descriptions = set()

    for task in tasks:
        desc = task.get("description", "").strip()
        if not desc or desc in seen_descriptions:
            continue
        seen_descriptions.add(desc)

        # Normalize owner
        owner = task.get("owner", "").strip()
        if not owner:
            owner = "Unassigned"

        # Validate status
        status_val = task.get("status", "open").lower()
        if status_val not in ["open", "in_progress", "done", "overdue"]:
            status_val = "open"

        # Deadline parsing validation
        deadline_val = task.get("deadline")
        if deadline_val and isinstance(deadline_val, str):
            if len(deadline_val) != 10:
                deadline_val = None

        normalized_tasks.append({
            "description": desc,
            "owner": owner,
            "deadline": deadline_val,
            "status": status_val,
            "source_quote": task.get("source_quote", desc),
            "chunk_index": task.get("chunk_index", 0),
        })

    extraction["tasks"] = normalized_tasks

    return {
        "extraction": extraction,
        "errors": errors,
    }
