from app.pipelines.state import MeetingState


async def task_sync_node(state: MeetingState) -> dict:
    errors = list(state.get("errors", []))
    extraction = state.get("extraction", {})
    tasks = extraction.get("tasks", [])

    for task in tasks:
        if not task.get("status"):
            task["status"] = "open"

    return {
        "extraction": extraction,
        "errors": errors,
    }
