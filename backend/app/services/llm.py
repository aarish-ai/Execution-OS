from typing import Optional
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_community.chat_models import FakeListChatModel

from app.core.config import settings


def get_llm(
    provider: Optional[str] = None,
    model_name: Optional[str] = None,
    fake_responses: Optional[list[str]] = None,
) -> BaseChatModel:
    """
    Factory that returns a LangChain chat model based on configured provider.
    Supports Ollama, Groq, Gemini, or FakeListChatModel for testing.
    """
    if fake_responses is not None:
        return FakeListChatModel(responses=fake_responses)

    selected_provider = (provider or settings.ACTIVE_LLM_PROVIDER).lower()
    selected_model = model_name or settings.ACTIVE_LLM_MODEL

    if selected_provider == "ollama":
        from langchain_ollama import ChatOllama

        return ChatOllama(
            base_url=settings.OLLAMA_BASE_URL,
            model=selected_model,
            temperature=0.1,
        )
    elif selected_provider == "groq":
        from langchain_groq import ChatGroq

        return ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model_name=selected_model or "llama-3.1-8b-instant",
            temperature=0.1,
        )
    elif selected_provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            google_api_key=settings.GEMINI_API_KEY,
            model=selected_model or "gemini-1.5-flash",
            temperature=0.1,
        )
    else:
        raise ValueError(f"Unsupported LLM provider: {selected_provider}")
