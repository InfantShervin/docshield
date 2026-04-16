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

# If we're missing something critical, we just can't start the app.
try:
    settings = Settings()
except ValidationError as e:
    print("\n[!] Heads up: Configuration error.")
    print("Looks like your .env file is missing something major (like DATABASE_URL or SECRET_KEY).")
    print("Check out the error details below or use .env.example to set things up.")
    print(f"Details: {e}\n")
    sys.exit(1)
except Exception as e:
    print(f"\n[!] Something went wrong while loading config: {e}\n")
    sys.exit(1)