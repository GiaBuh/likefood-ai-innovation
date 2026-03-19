import logging

from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from .backend_client import BackendClient
from .chat_service import ChatService
from .config import settings
from .exceptions import GeminiRateLimitError
from .gemini_client import GeminiClient
from .schemas import AiChatRequest, RestEnvelope

logger = logging.getLogger(__name__)

app = FastAPI(title="LikeFood FastAPI Chatbot", version="1.0.0")

origins = [origin.strip() for origin in settings.cors_allowed_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chat_service = ChatService(BackendClient(), GeminiClient())


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/ai-chat/respond", response_model=RestEnvelope)
async def ai_chat_respond(request: AiChatRequest, authorization: str | None = Header(default=None)) -> RestEnvelope:
    try:
        response = await chat_service.respond(request, auth_header=authorization)
        return RestEnvelope(data=response)
    except GeminiRateLimitError:
        logger.warning("Gemini rate limit hit for user request")
        return PlainTextResponse(
            content="AI đang quá tải, vui lòng thử lại sau 10 giây.",
            status_code=429,
            headers={"Retry-After": "10"},
        )
    except Exception:
        logger.exception("Unhandled error in ai_chat_respond")
        return PlainTextResponse(
            content="Không thể phản hồi AI (500)",
            status_code=500,
        )

