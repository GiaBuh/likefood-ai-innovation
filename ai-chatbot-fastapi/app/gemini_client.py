from __future__ import annotations

import asyncio

import httpx

from .config import settings


class GeminiClient:
    def __init__(self) -> None:
        self.enabled = settings.gemini_enabled and bool(settings.gemini_api_key.strip())

    async def rewrite_persuasive(self, fallback_text: str) -> str:
        if not self.enabled:
            return fallback_text
        endpoint = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
        )
        body = {
            "generationConfig": {"temperature": 0.35, "responseMimeType": "text/plain"},
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": (
                                "Bạn là trợ lý bán hàng thân thiện. Viết lại nội dung sau bằng tiếng Việt ngắn gọn, "
                                "hấp dẫn, đúng sự thật, không markdown, không phóng đại quá mức:\n"
                                f"{fallback_text}"
                            )
                        }
                    ],
                }
            ],
        }

        retries = max(1, settings.gemini_max_retries)
        delay = 0.4
        for attempt in range(retries):
            try:
                async with httpx.AsyncClient(timeout=settings.gemini_timeout_seconds) as client:
                    response = await client.post(endpoint, json=body)
                    response.raise_for_status()
                    data = response.json()
                    text = (
                        data.get("candidates", [{}])[0]
                        .get("content", {})
                        .get("parts", [{}])[0]
                        .get("text", "")
                        .strip()
                    )
                    return text or fallback_text
            except Exception:
                if attempt == retries - 1:
                    return fallback_text
                await asyncio.sleep(delay)
                delay *= 2
        return fallback_text

