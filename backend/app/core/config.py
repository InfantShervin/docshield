import sys
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import ValidationError

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables or .env file.
    """
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    OPENAI_API_KEY: Optional[str] = ""
    MODEL_PATH: str = "./sgat_layoutlm_model.pth"
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

# Strictly safe environment loading: fail fast if required config is missing.
try:
    settings = Settings()
except ValidationError as e:
    print("\n[!] CRITICAL: Configuration Error")
    print("Required environment variables are missing or invalid.")
    print("Ensure your .env file exists and contains DATABASE_URL and SECRET_KEY.")
    print(f"Details: {e}\n")
    sys.exit(1)
except Exception as e:
    print(f"\n[!] UNEXPECTED ERROR during config initialization: {e}\n")
    sys.exit(1)