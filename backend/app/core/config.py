from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Execution OS"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database & Cache
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/execution_os"
    TEST_DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/execution_os_test"
    REDIS_URL: str = "redis://localhost:6379/0"

    # LLM Services
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    GROQ_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    ACTIVE_LLM_PROVIDER: str = "ollama"  # ollama | groq | gemini
    ACTIVE_LLM_MODEL: str = "llama3.2"   # e.g. llama3.2, llama3-8b-8192, gemini-1.5-flash

    # Embeddings
    ACTIVE_EMBEDDING_PROVIDER: str = "ollama"  # ollama | huggingface
    EMBEDDING_DIMENSION: int = 768             # 768 for nomic-embed-text, 384 for all-MiniLM-L6-v2

    # Observability / LangSmith
    LANGSMITH_API_KEY: Optional[str] = None
    LANGSMITH_PROJECT: str = "execution-os"
    LANGCHAIN_TRACING_V2: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
