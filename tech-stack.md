# Tech Stack: AI Execution OS

## Languages
- **Python**: Core backend language, native to the AI/LangChain ecosystem.
- **TypeScript/JavaScript**: Frontend language for Next.js and React components.

## Frameworks & Libraries
- **Backend**: FastAPI (high performance, async-friendly, Pythonic).
- **Frontend**: Next.js (SSR, routing), Tailwind CSS (styling), shadcn/ui (accessible component library).
- **Agent Orchestration**: LangGraph (stateful pipelines) and LangChain.

## Database & Search
- **Primary Database**: PostgreSQL.
- **Vector Search**: pgvector (runs directly in Postgres).
- **Keyword Search**: Postgres FTS (Full-Text Search).

## Background Jobs & Scheduling
- **Task Queue**: Celery.
- **Message Broker**: Redis.

## LLM & Inference Layer
- **Primary Development**: Ollama (local models like llama3.2, qwen2.5, mistral).
- **API Fallbacks**: Groq API, Gemini Flash (fast inference, generous free tiers).
- **Embeddings**: nomic-embed-text (via Ollama) or all-MiniLM-L6-v2 (via sentence-transformers).

## Infrastructure & Deployment
- **Containerization**: Docker & Docker Compose for local orchestration.
- **Deployment Target**: Cloud provider to be decided later. We will build local-first and containerized to ensure portability.

## Rationale & Constraints
- **Zero Paid Dependencies**: The core constraint is keeping operating costs at zero during V1. All tools selected are open-source, have generous free tiers, or can run locally.
- **FastAPI over Node.js**: Chosen to prevent a Python/JS mismatch at the orchestration layer, keeping the backend native to LangGraph.
