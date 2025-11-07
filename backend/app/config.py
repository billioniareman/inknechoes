from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    # Environment
    ENV: str = "development"
    
    # Database URLs
    POSTGRES_URL: str = "postgresql://postgres:ayush@localhost:5432/postgres"
    MONGO_URI: str = "mongodb://localhost:27017/inknechoes"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # AWS S3
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    S3_BUCKET: str = "inknechoes-media"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Email
    EMAIL_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@inknechoes.com"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "https://inknechoes.com"]
    
    # App
    APP_NAME: str = "Ink&Echoes"
    API_V1_PREFIX: str = "/api/v1"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()

