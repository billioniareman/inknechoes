from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import Limiter, _rate_limit_exceeded_handler
from app.config import get_settings
from app.database.postgres import engine, Base, run_migrations
from app.database.mongo import connect_to_mongo, close_mongo_connection
# Import models to ensure they're registered with Base
from app.models import (
    User, Post, Comment, Chapter, Bookmark, ReadingProgress, 
    AuditLog, UserPreferences, UserSession, VerificationToken, followers, Notification, Tag, post_tags, CollaborativeBook
)
from app.middleware.logging import log_requests
from app.middleware.rate_limiter import limiter
from app.routes import auth, posts, comments, users, admin, chapters, bookmarks, reading_progress, feed, follows, notifications, tags, rss, analytics, export, collaboration
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

# Development: ensure CORS headers are present even on error responses or OPTIONS preflight
from fastapi import Request, Response

@app.middleware("http")
async def universal_cors_middleware(request: Request, call_next):
    """Add universal CORS headers for all environments and handle OPTIONS preflight."""
    origin = request.headers.get("origin")

    # Handle OPTIONS preflight quickly
    if request.method == "OPTIONS":
        resp = Response(status_code=200)
        if origin:
            resp.headers["Access-Control-Allow-Origin"] = origin
            resp.headers["Access-Control-Allow-Credentials"] = "true"
            resp.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type,X-Requested-With,Accept,Origin"
            resp.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS,PATCH"
        return resp

    response = await call_next(request)

    # Add CORS headers for all environments
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type,X-Requested-With,Accept,Origin"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS,PATCH"
    
    return response

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
app.include_router(follows.router, prefix=settings.API_V1_PREFIX)
app.include_router(notifications.router, prefix=settings.API_V1_PREFIX)
app.include_router(tags.router, prefix=settings.API_V1_PREFIX)
app.include_router(rss.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)
app.include_router(export.router, prefix=settings.API_V1_PREFIX)
app.include_router(collaboration.router, prefix=settings.API_V1_PREFIX)

from app.services.post_service import create_mongodb_text_index

@app.on_event("startup")
async def startup_event():
    """Initialize database connections and indexes"""
    # Run PostgreSQL migrations
    try:
        run_migrations()
    except Exception as e:
        print(f"[WARNING] Alembic migration failed: {e}. Falling back to create_all.")
        try:
            Base.metadata.create_all(bind=engine)
            print("[OK] Database tables created successfully via fallback")
        except Exception as err:
            print(f"[ERROR] Database connection failed: {err}")
            print("[WARNING] Continuing without Database - some features may not work")
    
    # Connect to MongoDB
    try:
        await connect_to_mongo()
        print("[OK] MongoDB connected successfully")
    except Exception as e:
        print(f"[ERROR] MongoDB connection failed: {e}")
        print("[WARNING] Continuing without MongoDB - some features may not work")
    
    # Create MongoDB text index for search functionality
    try:
        await create_mongodb_text_index()
        print("[OK] MongoDB text index created successfully")
    except Exception as e:
        print(f"[INFO] Text index may already exist or error occurred: {e}")


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

