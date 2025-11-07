from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache
import os


class Settings(BaseSettings):
    # Environment
    ENV: str = os.getenv("ENV", "development")
    
    # Database URLs
    POSTGRES_URL: str = os.getenv("POSTGRES_URL", "postgresql://postgres:ayush@localhost:5432/postgres")
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/inknechoes")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Cloudinary (for free tier image storage)
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
    
    # AWS S3 (optional, if you prefer S3)
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    S3_BUCKET: str = os.getenv("S3_BUCKET", "inknechoes-media")
    
    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Email (Brevo - free tier)
    BREVO_API_KEY: str = os.getenv("BREVO_API_KEY", "")
    EMAIL_API_KEY: str = os.getenv("EMAIL_API_KEY", "")  # Legacy support for Resend
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "noreply@inknechoes.com")
    
    # CORS
    CORS_ORIGINS: List[str] = os.getenv(
        "CORS_ORIGINS", 
        "http://localhost:5173,https://inknechoes.com"
    ).split(",") if isinstance(os.getenv("CORS_ORIGINS"), str) else ["http://localhost:5173", "https://inknechoes.com"]
    
    # App
    APP_NAME: str = "Ink&Echoes"
    API_V1_PREFIX: str = "/api/v1"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()

