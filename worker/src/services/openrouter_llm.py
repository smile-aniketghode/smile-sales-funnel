"""
OpenRouter LLM Integration for LangChain

Provides a ChatOpenAI-compatible wrapper for OpenRouter API
"""
from typing import Any, Dict, List, Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
import os
import logging
import asyncio
from functools import wraps

logger = logging.getLogger(__name__)


def retry_with_exponential_backoff(
    max_retries: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 8.0,
    exponential_base: float = 2.0
):
    """
    Retry decorator with exponential backoff for rate limits

    Args:
        max_retries: Maximum number of retry attempts
        initial_delay: Initial delay in seconds
        max_delay: Maximum delay between retries
        exponential_base: Base for exponential backoff calculation
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            delay = initial_delay
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    error_str = str(e).lower()

                    # Check if it's a rate limit error (429)
                    is_rate_limit = (
                        "429" in error_str or
                        "rate limit" in error_str or
                        "too many requests" in error_str
                    )

                    # Only retry on rate limit errors
                    if is_rate_limit and attempt < max_retries:
                        logger.warning(
                            f"Rate limit hit (attempt {attempt + 1}/{max_retries + 1}). "
                            f"Retrying in {delay:.1f}s..."
                        )
                        await asyncio.sleep(delay)
                        delay = min(delay * exponential_base, max_delay)
                    else:
                        # Non-retryable error or max retries reached
                        if attempt == max_retries:
                            logger.error(f"Max retries ({max_retries}) exceeded for rate limit")
                        raise

            raise last_exception

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            delay = initial_delay
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    error_str = str(e).lower()

                    is_rate_limit = (
                        "429" in error_str or
                        "rate limit" in error_str or
                        "too many requests" in error_str
                    )

                    if is_rate_limit and attempt < max_retries:
                        logger.warning(
                            f"Rate limit hit (attempt {attempt + 1}/{max_retries + 1}). "
                            f"Retrying in {delay:.1f}s..."
                        )
                        import time
                        time.sleep(delay)
                        delay = min(delay * exponential_base, max_delay)
                    else:
                        if attempt == max_retries:
                            logger.error(f"Max retries ({max_retries}) exceeded for rate limit")
                        raise

            raise last_exception

        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

    return decorator


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
        max_retries: int = 3,
        **kwargs
    ):
        """
        Initialize OpenRouter LLM

        Args:
            model: OpenRouter model ID (e.g., "mistralai/mistral-small-3.2-24b-instruct:free")
            api_key: OpenRouter API key (or set OPENROUTER_API_KEY env var)
            temperature: Sampling temperature (0.0-2.0)
            max_retries: Maximum retry attempts for rate limits
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

        self.max_retries = max_retries
        logger.info(f"Initialized OpenRouter LLM with model: {model}, max_retries: {max_retries}")

    @retry_with_exponential_backoff(max_retries=3)
    async def _agenerate(self, *args, **kwargs):
        """Override async generation with retry logic"""
        return await super()._agenerate(*args, **kwargs)

    @retry_with_exponential_backoff(max_retries=3)
    def _generate(self, *args, **kwargs):
        """Override sync generation with retry logic"""
        return super()._generate(*args, **kwargs)

    def __repr__(self) -> str:
        return f"OpenRouterLLM(model={self.model_name})"
