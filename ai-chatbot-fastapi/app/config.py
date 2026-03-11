from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    backend_base_url: str = "http://backend:8080"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-pro"
    gemini_enabled: bool = True
    gemini_timeout_seconds: float = 5.0
    gemini_max_retries: int = 2
    chatbot_fastapi_port: int = 8091
    cors_allowed_origins: str = "http://localhost,http://127.0.0.1,http://localhost:80,http://127.0.0.1:80"

    model_config = SettingsConfigDict(env_prefix="", extra="ignore")


settings = Settings()

