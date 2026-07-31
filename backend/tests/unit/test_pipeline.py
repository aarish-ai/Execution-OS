import json
import pytest
from app.pipelines.nodes.ingest import ingest_node
from app.pipelines.nodes.parse import parse_node
from app.pipelines.nodes.extract import extract_node
from app.services.llm import get_llm
from app.services.embeddings import DeterministicEmbeddings
from tests.sample_transcript import SAMPLE_TRANSCRIPT


@pytest.mark.asyncio
async def test_ingest_and_parse_nodes():
    state = {"raw_transcript": SAMPLE_TRANSCRIPT, "errors": []}
    ingest_res = await ingest_node(state)
    assert "raw_transcript" in ingest_res

    parse_res = await parse_node(ingest_res)
    chunks = parse_res["chunks"]
    assert len(chunks) > 5
    assert chunks[0]["speaker"] == "Ahmed"


@pytest.mark.asyncio
async def test_extract_node_with_fake_llm():
    fake_json = json.dumps({
        "decisions": [{"content": "Postgres with pgvector chosen", "owner": "Team", "rationale": "relational + vector", "source_quote": "Let's go with Postgres plus pgvector", "chunk_index": 2}],
        "tasks": [{"description": "Setup DB schema", "owner": "Omar", "deadline": "2026-08-06", "source_quote": "I'll have it done by Thursday", "chunk_index": 3}],
        "open_questions": [{"content": "Is HNSW in pgvector enough?", "raised_by": "Ahmed", "chunk_index": 4}],
        "topics": ["database", "schema"]
    })

    fake_llm = get_llm(fake_responses=[fake_json])

    state = {
        "chunks": [{"speaker": "Ahmed", "content": "Let's use Postgres", "chunk_index": 0}],
        "errors": []
    }

    extract_res = await extract_node(state, llm=fake_llm)
    assert extract_res["health_score"] > 0.3
    assert len(extract_res["extraction"]["decisions"]) == 1
    assert extract_res["extraction"]["tasks"][0]["owner"] == "Omar"
