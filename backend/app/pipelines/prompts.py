EXTRACTION_PROMPT = """You are an expert meeting intelligence parser. Analyze the following meeting transcript excerpts and extract structured outcomes.

Return ONLY a valid JSON object matching this exact schema:
{{
  "decisions": [
    {{
      "content": "Description of decision made",
      "owner": "Name of person or null if team decision",
      "rationale": "Why this decision was made or null",
      "source_quote": "Exact verbatim quote from transcript",
      "chunk_index": 0
    }}
  ],
  "tasks": [
    {{
      "description": "Task action item",
      "owner": "Assigned person name",
      "deadline": "YYYY-MM-DD or relative date string or null",
      "source_quote": "Exact verbatim quote from transcript",
      "chunk_index": 0
    }}
  ],
  "open_questions": [
    {{
      "content": "Unresolved question raised",
      "raised_by": "Name of person or null",
      "chunk_index": 0
    }}
  ],
  "topics": ["topic1", "topic2"]
}}

Transcript Excerpts:
{transcript_text}
"""

REPAIR_EXTRACTION_PROMPT = """The output was not valid JSON matching the requested schema.
Error details: {error_msg}

Please fix and return ONLY valid JSON:
{malformed_json}
"""

CONTRADICTION_PROMPT = """You are an AI auditor checking for team statement contradictions.
Examine the NEW decision below against PRIOR historical decisions on the same topic.

NEW DECISION:
"{new_decision}"

PRIOR HISTORICAL DECISION:
"{prior_decision}"

Does the NEW decision contradict or conflict with the PRIOR decision?
Respond strictly in valid JSON format:
{{
  "contradicts": true/false,
  "explanation": "Clear explanation of how they conflict, or null if no conflict"
}}
"""

SUMMARIZATION_PROMPT = """Given the meeting transcript and extracted outcomes below, write a concise 3-5 sentence meeting summary focusing on key commitments and decisions.

Extraction Details:
{extraction_json}

Transcript Excerpts:
{transcript_text}
"""

PRE_MEETING_BRIEF_PROMPT = """Generate a clean markdown Pre-Meeting Context Brief for the team lead based on the following unresolved open questions and open tasks.

Open Tasks:
{tasks_text}

Unresolved Questions:
{questions_text}

Last Decided:
{decisions_text}

Format as:
# Pre-Meeting Brief
## Unresolved Questions
## Open Tasks
## Last Decided
"""
