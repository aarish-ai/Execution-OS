# Project Roadmap: AI Execution OS

## Phase 1: Core System (V1)
**Goal:** A fully functional, production-ready system that takes pasted transcripts, extracts structured meeting outcomes locally, and presents them in a unified UI.

### Milestone 1: Database & Backend Foundation
- **Tasks:** Setup PostgreSQL with pgvector. Configure FastAPI project. Define ORM models (Meetings, Topics, Decisions, Tasks).
- **Testing:** Write `pytest` cases using a local test DB to verify CRUD operations and pgvector embedding storage.

### Milestone 2: LLM & LangGraph Core
- **Tasks:** Setup LLM integrations (Ollama/Groq) via LangChain. Build the LangGraph pipeline (Ingest → Parse → Extract → Summarize).
- **Testing:** Unit tests with mock LLM responses. Integration tests feeding a sample transcript to verify the structured JSON output is correct.

### Milestone 3: Search & Intelligence
- **Tasks:** Implement Postgres FTS + pgvector hybrid search. Build the "Contradiction Check" node using this search.
- **Testing:** Seed DB with historical decisions, feed a conflicting transcript, and assert the system successfully flags the contradiction.

### Milestone 4: API & Background Jobs
- **Tasks:** Build REST API endpoints. Setup Celery + Redis for "Weekly Brief" generation.
- **Testing:** Use FastAPI `TestClient` for API validation. Run Celery workers locally to trigger and verify the background brief generation.

### Milestone 5: Frontend MVP (Next.js)
- **Tasks:** Implement Command Center (dashboard), Meeting Room (split-pane transcript + cards), and Ask Anything (chat interface) using `shadcn/ui`.
- **Testing:** Component testing, plus automated E2E testing (e.g., Playwright) for the core flow: pasting a transcript and viewing extracted cards.

### Milestone 6: Cloud Deployment
- **Tasks:** Dockerize frontend, backend, and workers. Deploy to a cloud provider.
- **Testing:** End-to-end manual testing on the live production environment to verify performance and connectivity.

---

## Phase 2: Integrations & Intelligence (V2)
**Goal:** Enhance the system with audio transcription, advanced relationship tracking, and workflow automation.

### Milestone 1: Audio & Diarization
- **Tasks:** Integrate local Whisper for audio file upload and WhisperX for speaker diarization.
- **Testing:** Upload sample audio files and verify transcript accuracy and speaker mapping.

### Milestone 2: Advanced Graph & Automation
- **Tasks:** Migrate complex entity relationships to Neo4j. Add Calendar integration and Slack/Email delivery.
- **Testing:** Mock calendar events to trigger pre-meeting briefs. Verify Slack webhook payload deliveries.
