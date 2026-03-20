from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List
from functools import lru_cache
import os


class Settings(BaseSettings):
    # Environment
    ENV: str = "development"
    FRONTEND_URL: str = "inknechoes.vercel.app"
    # Database URLs
    @property
    def POSTGRES_URL(self) -> str:
        """Get PostgreSQL URL from environment or use default"""
        return os.getenv('POSTGRES_URL') or "postgresql://postgres:ayush@localhost:5432/postgres"
    
    @property
    def MONGO_URI(self) -> str:
        """Get MongoDB URI from environment or use default"""
        return os.getenv('MONGO_URI') or "mongodb://localhost:27017/inknechoes"
    
    # Cloudinary (for free tier image storage)
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    
    # AWS S3 (optional, if you prefer S3)
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    S3_BUCKET: str = "inknechoes-media"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Email (Brevo - free tier)
    BREVO_API_KEY: str = "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"
    EMAIL_API_KEY: str = ""  # Legacy support for Resend
    EMAIL_FROM: str = "rampra9981@gmail.com"
    
    # CORS - stored as string, parsed to list via property
    # Use Field with validation_alias to map CORS_ORIGINS env var
    # Default: localhost for dev, production will override via env var
    cors_origins_str: str = Field(
        default="http://localhost:5173",
        validation_alias="CORS_ORIGINS"
    )
    
    # App
    APP_NAME: str = "Ink&Echoes"
    API_V1_PREFIX: str = "/api/v1"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        env_ignore_empty=True,
    )
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Parse comma-separated CORS origins string into list"""
        # Get from field or environment variable
        cors_str = self.cors_origins_str or os.getenv('CORS_ORIGINS', "http://localhost:5173")
        if not cors_str:
            # Default to localhost for local development
            return ["http://localhost:5173"]
        # Parse comma-separated string and strip whitespace
        origins = [origin.strip() for origin in cors_str.split(",") if origin.strip()]
        return origins if origins else ["http://localhost:5173"]


def get_settings() -> Settings:
    settings = Settings()
    return settings

