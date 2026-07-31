from app.pipelines.state import MeetingState


async def ingest_node(state: MeetingState) -> dict:
    errors = list(state.get("errors", []))
    raw_transcript = state.get("raw_transcript", "")

    if not raw_transcript or not raw_transcript.strip():
        errors.append("Raw transcript is empty.")
        return {"errors": errors}

    cleaned_transcript = "\n".join(
        line.strip() for line in raw_transcript.splitlines() if line.strip()
    )

    return {
        "raw_transcript": cleaned_transcript,
        "errors": errors,
    }
