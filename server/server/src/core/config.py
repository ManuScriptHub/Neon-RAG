import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "RAG-ify Project"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    API_KEY: str = os.getenv("X-API-KEY")
    VOYAGE_API_KEY: str = os.getenv("VOYAGE_API_KEY")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")


settings = Settings()
