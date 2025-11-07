from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.schemas.reading_progress_schema import ReadingProgressResponse, ReadingProgressUpdate
from app.services.reading_progress_service import (
    get_or_create_reading_progress, update_reading_progress,
    get_reading_progress, get_user_reading_stats
)
from app.utils.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/reading-progress", tags=["reading-progress"])


@router.get("/post/{post_id}", response_model=ReadingProgressResponse)
async def get_reading_progress_for_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get reading progress for a specific post"""
    progress = get_reading_progress(db, current_user.id, post_id)
    if not progress:
        # Create initial progress
        progress = get_or_create_reading_progress(db, current_user.id, post_id)
    return progress


@router.put("/post/{post_id}", response_model=ReadingProgressResponse)
async def update_reading_progress_for_post(
    post_id: int,
    progress_data: ReadingProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update reading progress for a post"""
    current_page = progress_data.current_page or 1
    total_pages = progress_data.total_pages or 1
    reading_time = progress_data.reading_time_minutes or 0
    
    progress = update_reading_progress(
        db, current_user.id, post_id, current_page, total_pages, reading_time
    )
    return progress


@router.get("/stats", response_model=dict)
async def get_my_reading_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get reading statistics for current user"""
    stats = get_user_reading_stats(db, current_user.id)
    return stats

