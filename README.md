# AI Execution OS v1.0

A meeting intelligence system built for team leads. Paste raw transcripts in, and the system extracts decisions, assigns tasks with deadlines, tracks open questions, flags contradictions against prior meetings, and answers natural language queries with source citations.

---

## Architecture Overview

- **Frontend:** Next.js 14 App Router, TypeScript, Tailwind CSS, Glassmorphism UI
- **Backend:** FastAPI (async Python 3.11), SQLAlchemy Async ORM, Alembic migrations
- **Agent Orchestration:** LangGraph stateful graph pipeline (Ingest → Parse → Extract → Link → Contradiction → Summarize → Brief → Task Sync → Store)
- **Database & Search:** PostgreSQL + `pgvector` extension for vector embeddings & FTS hybrid retrieval
- **Task Queue & Jobs:** Celery + Redis for weekly brief generation, drift alerts, and task overdue tracking
- **LLM Layer:** Swappable abstraction supporting Ollama (`llama3.2`), Groq, and Gemini Flash
- **Embeddings:** Local `nomic-embed-text` via Ollama or `all-MiniLM-L6-v2`

---

## Quick Start (One Command)

### Prerequisites
1. Install [Docker](https://www.docker.com/) and Docker Compose.
2. (Optional for local LLM inference): Install [Ollama](https://ollama.com/) locally and run:
   ```bash
   ollama pull llama3.2
   ollama pull nomic-embed-text
   ```

### 1. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 2. Launch Services
Run the containerized stack:
```bash
docker compose up --build
```

### 3. Run Database Migrations
In a separate terminal, execute Alembic migrations:
```bash
docker compose run --rm backend alembic upgrade head
```

- **Frontend App:** http://localhost:3000
- **FastAPI Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

---

## Environment Variables Reference

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://postgres:postgres@postgres:5432/execution_os` |
| `REDIS_URL` | Redis URL for Celery workers | `redis://redis:6379/0` |
| `ACTIVE_LLM_PROVIDER` | Active LLM inference provider | `ollama` (options: `ollama`, `groq`, `gemini`) |
| `ACTIVE_LLM_MODEL` | Active LLM model name | `llama3.2` |
| `OLLAMA_BASE_URL` | Base URL for Ollama local server | `http://host.docker.internal:11434` |
| `GROQ_API_KEY` | Groq API Key (Free tier) | `gsk_...` |
| `GEMINI_API_KEY` | Gemini API Key (Free tier) | `AIzaSy...` |
| `ACTIVE_EMBEDDING_PROVIDER`| Active embedding model | `ollama` (options: `ollama`, `huggingface`) |
| `EMBEDDING_DIMENSION` | Vector embedding dimension size | `768` for nomic, `384` for MiniLM |

---

## Running Tests

### Backend Unit & Integration Tests
Run pytest within the backend environment:
```bash
cd backend
pytest tests/ -v
```

---

## Production Readiness Checklist

- [x] Postgres running with pgvector enabled & migrations applied
- [x] Ollama accessible or Groq / Gemini Flash API keys set
- [x] Redis connected with Celery worker and beat schedulers active
- [x] LangSmith tracing support configured via environment
- [x] Frontend API client using relative path / env URL resolution
