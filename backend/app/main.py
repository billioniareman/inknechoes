from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import Limiter, _rate_limit_exceeded_handler
from app.config import get_settings
from app.database.postgres import engine, Base
from app.database.mongo import connect_to_mongo, close_mongo_connection
# Import models to ensure they're registered with Base
from app.models import (
    User, Post, Comment, Chapter, Bookmark, ReadingProgress, 
    AuditLog, UserPreferences, UserSession
)
from app.middleware.logging import log_requests
from app.middleware.rate_limiter import limiter
from app.routes import auth, posts, comments, users, admin, chapters, bookmarks, reading_progress, feed
import uvicorn

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="A platform for writers to create, edit, publish, and share their works",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip compression - disabled for now to avoid gzip errors with small responses
# app.add_middleware(GZipMiddleware, minimum_size=1000) 

# Request logging
app.middleware("http")(log_requests)

# Rate limiting (configured but not actively used in all routes)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(posts.router, prefix=settings.API_V1_PREFIX)
app.include_router(comments.router, prefix=settings.API_V1_PREFIX)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin.router, prefix=settings.API_V1_PREFIX)
app.include_router(chapters.router, prefix=settings.API_V1_PREFIX)
app.include_router(bookmarks.router, prefix=settings.API_V1_PREFIX)
app.include_router(reading_progress.router, prefix=settings.API_V1_PREFIX)
app.include_router(feed.router, prefix=settings.API_V1_PREFIX)


@app.on_event("startup")
async def startup_event():
    """Initialize database connections"""
    # Create PostgreSQL tables
    Base.metadata.create_all(bind=engine)
    
    # Connect to MongoDB
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown_event():
    """Close database connections"""
    await close_mongo_connection()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Ink&Echoes API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENV == "development"
    )

