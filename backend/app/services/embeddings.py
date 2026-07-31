from typing import List, Optional
from langchain_core.embeddings import Embeddings
from langchain_community.embeddings import FakeEmbeddings

from app.core.config import settings


class DeterministicEmbeddings(Embeddings):
    """Fallback embedding generator for testing environments without GPU/Ollama."""

    def __init__(self, dimension: int = 768):
        self.dimension = dimension

    def _embed(self, text: str) -> List[float]:
        val = sum(ord(c) for c in text) % 100 / 100.0
        return [val] * self.dimension

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._embed(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._embed(text)


def get_embedder(provider: Optional[str] = None) -> Embeddings:
    selected_provider = (provider or settings.ACTIVE_EMBEDDING_PROVIDER).lower()

    try:
        if selected_provider == "ollama":
            from langchain_ollama import OllamaEmbeddings

            return OllamaEmbeddings(
                base_url=settings.OLLAMA_BASE_URL,
                model="nomic-embed-text",
            )
        elif selected_provider == "huggingface":
            from langchain_community.embeddings import HuggingFaceEmbeddings

            return HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2"
            )
        else:
            return DeterministicEmbeddings(dimension=settings.EMBEDDING_DIMENSION)
    except Exception:
        # Fallback if Ollama or HuggingFace model download fails offline
        return DeterministicEmbeddings(dimension=settings.EMBEDDING_DIMENSION)
