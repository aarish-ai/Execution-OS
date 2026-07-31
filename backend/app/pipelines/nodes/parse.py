import re
from typing import List, Dict, Any
from app.pipelines.state import MeetingState


async def parse_node(state: MeetingState) -> dict:
    errors = list(state.get("errors", []))
    transcript = state.get("raw_transcript", "")

    chunks: List[Dict[str, Any]] = []

    try:
        lines = transcript.splitlines()
        current_speaker = None
        current_buffer = []
        chunk_index = 0

        speaker_pattern = re.compile(r"^([A-Z][a-zA-Z0-9_\s]{1,30}):\s*(.*)$")

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            match = speaker_pattern.match(line_str)
            if match:
                speaker, content = match.group(1), match.group(2)
                if current_buffer:
                    chunks.append({
                        "speaker": current_speaker,
                        "content": " ".join(current_buffer),
                        "chunk_index": chunk_index,
                    })
                    chunk_index += 1
                    current_buffer = []

                current_speaker = speaker
                current_buffer.append(content)
            else:
                current_buffer.append(line_str)

        if current_buffer:
            chunks.append({
                "speaker": current_speaker,
                "content": " ".join(current_buffer),
                "chunk_index": chunk_index,
            })

        # Fallback if no speaker turns matched
        if not chunks and transcript:
            chunks.append({
                "speaker": None,
                "content": transcript,
                "chunk_index": 0,
            })

    except Exception as e:
        errors.append(f"Parse node error: {str(e)}")

    return {
        "chunks": chunks,
        "errors": errors,
    }
