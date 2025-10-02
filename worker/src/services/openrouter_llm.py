"""
OpenRouter LLM Integration for LangChain

Provides a ChatOpenAI-compatible wrapper for OpenRouter API
"""
from typing import Any, Dict, List, Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
import os
import logging

logger = logging.getLogger(__name__)


class OpenRouterLLM(ChatOpenAI):
    """
    OpenRouter LLM wrapper compatible with LangChain

    Uses ChatOpenAI as base since OpenRouter API is OpenAI-compatible
    """

    def __init__(
        self,
        model: str = "mistralai/mistral-small-3.2-24b-instruct:free",
        api_key: Optional[str] = None,
        temperature: float = 0.1,
        **kwargs
    ):
        """
        Initialize OpenRouter LLM

        Args:
            model: OpenRouter model ID (e.g., "mistralai/mistral-small-3.2-24b-instruct:free")
            api_key: OpenRouter API key (or set OPENROUTER_API_KEY env var)
            temperature: Sampling temperature (0.0-2.0)
            **kwargs: Additional arguments passed to ChatOpenAI
        """
        # Get API key from env if not provided
        api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY must be set in environment or passed as argument")

        # OpenRouter base URL
        base_url = "https://openrouter.ai/api/v1"

        # Initialize ChatOpenAI with OpenRouter settings
        super().__init__(
            model=model,
            openai_api_key=api_key,
            openai_api_base=base_url,
            temperature=temperature,
            model_kwargs={
                "response_format": {"type": "json_object"},  # Force JSON output
            },
            **kwargs
        )

        logger.info(f"Initialized OpenRouter LLM with model: {model}")

    def __repr__(self) -> str:
        return f"OpenRouterLLM(model={self.model_name})"
