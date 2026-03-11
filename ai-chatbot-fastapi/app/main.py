from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware

from .backend_client import BackendClient
from .chat_service import ChatService
from .config import settings
from .gemini_client import GeminiClient
from .schemas import AiChatRequest, RestEnvelope

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
    response = await chat_service.respond(request, auth_header=authorization)
    return RestEnvelope(data=response)

