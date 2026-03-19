"""Custom exceptions for the AI chatbot service."""

from __future__ import annotations


class GeminiRateLimitError(Exception):
    """Raised when Gemini API returns 429 (quota exceeded) after all retries."""
    pass


class GeminiTimeoutError(Exception):
    """Raised when Gemini API does not respond within the configured timeout."""
    pass
