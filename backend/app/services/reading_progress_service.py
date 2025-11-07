"""
Service for managing reading progress
"""
from sqlalchemy.orm import Session
from app.models.reading_progress import ReadingProgress
from app.schemas.reading_progress_schema import ReadingProgressCreate, ReadingProgressUpdate
from typing import Optional
from datetime import datetime


def get_or_create_reading_progress(db: Session, user_id: int, post_id: int) -> ReadingProgress:
    """Get or create reading progress for user and post"""
    progress = db.query(ReadingProgress).filter(
        ReadingProgress.user_id == user_id,
        ReadingProgress.post_id == post_id
    ).first()
    
    if not progress:
        progress = ReadingProgress(
            user_id=user_id,
            post_id=post_id,
            current_page=1,
            total_pages=1,
            progress_percentage=0.0,
            reading_time_minutes=0
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
    
    return progress


def update_reading_progress(
    db: Session,
    user_id: int,
    post_id: int,
    current_page: int,
    total_pages: int,
    reading_time_minutes: int = 0
) -> ReadingProgress:
    """Update reading progress"""
    progress = get_or_create_reading_progress(db, user_id, post_id)
    
    progress.current_page = current_page
    progress.total_pages = total_pages
    progress.progress_percentage = (current_page / total_pages * 100) if total_pages > 0 else 0.0
    progress.reading_time_minutes += reading_time_minutes
    progress.last_read_at = datetime.now()
    
    db.commit()
    db.refresh(progress)
    return progress


def get_reading_progress(db: Session, user_id: int, post_id: int) -> Optional[ReadingProgress]:
    """Get reading progress for user and post"""
    return db.query(ReadingProgress).filter(
        ReadingProgress.user_id == user_id,
        ReadingProgress.post_id == post_id
    ).first()


def get_user_reading_stats(db: Session, user_id: int) -> dict:
    """Get reading statistics for a user"""
    all_progress = db.query(ReadingProgress).filter(ReadingProgress.user_id == user_id).all()
    
    total_books_read = len(all_progress)
    total_reading_time = sum(p.reading_time_minutes for p in all_progress)
    total_pages_read = sum(p.current_page for p in all_progress)
    avg_progress = sum(p.progress_percentage for p in all_progress) / len(all_progress) if all_progress else 0
    
    return {
        "total_books_read": total_books_read,
        "total_reading_time_minutes": total_reading_time,
        "total_pages_read": total_pages_read,
        "average_completion": round(avg_progress, 1)
    }

