import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    OPENAI_API_KEY: str = ""
    MODEL_PATH: str = "./sgat_layoutlm_model.pth"
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        # Load .env in dev, .env.production in production if available. Railway injects env vars directly in production.
        env_file = ".env" if os.getenv("ENVIRONMENT", "development") != "production" else ".env.production"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()