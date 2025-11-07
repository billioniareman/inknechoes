"""
Service for managing bookmarks
"""
from sqlalchemy.orm import Session
from app.models.bookmark import Bookmark
from app.models.post import Post
from app.schemas.bookmark_schema import BookmarkCreate, BookmarkUpdate
from typing import List, Optional


def create_bookmark(db: Session, bookmark_data: BookmarkCreate, user_id: int) -> Bookmark:
    """Create a new bookmark"""
    # Check if bookmark already exists for this user and post
    existing = db.query(Bookmark).filter(
        Bookmark.user_id == user_id,
        Bookmark.post_id == bookmark_data.post_id
    ).first()
    
    if existing:
        # Update existing bookmark
        if bookmark_data.chapter_id:
            existing.chapter_id = bookmark_data.chapter_id
        if bookmark_data.page_number:
            existing.page_number = bookmark_data.page_number
        if bookmark_data.note:
            existing.note = bookmark_data.note
        db.commit()
        db.refresh(existing)
        return existing
    
    # Create new bookmark
    db_bookmark = Bookmark(
        user_id=user_id,
        post_id=bookmark_data.post_id,
        chapter_id=bookmark_data.chapter_id,
        page_number=bookmark_data.page_number,
        note=bookmark_data.note
    )
    db.add(db_bookmark)
    db.commit()
    db.refresh(db_bookmark)
    return db_bookmark


def get_bookmark(db: Session, bookmark_id: int) -> Optional[Bookmark]:
    """Get bookmark by ID"""
    return db.query(Bookmark).filter(Bookmark.id == bookmark_id).first()


def get_user_bookmarks(db: Session, user_id: int) -> List[Bookmark]:
    """Get all bookmarks for a user"""
    return db.query(Bookmark).filter(Bookmark.user_id == user_id).order_by(Bookmark.created_at.desc()).all()


def get_bookmark_for_post(db: Session, user_id: int, post_id: int) -> Optional[Bookmark]:
    """Get bookmark for a specific post and user"""
    return db.query(Bookmark).filter(
        Bookmark.user_id == user_id,
        Bookmark.post_id == post_id
    ).first()


def update_bookmark(db: Session, bookmark: Bookmark, bookmark_data: BookmarkUpdate) -> Bookmark:
    """Update bookmark"""
    if bookmark_data.chapter_id is not None:
        bookmark.chapter_id = bookmark_data.chapter_id
    if bookmark_data.page_number is not None:
        bookmark.page_number = bookmark_data.page_number
    if bookmark_data.note is not None:
        bookmark.note = bookmark_data.note
    
    db.commit()
    db.refresh(bookmark)
    return bookmark


def delete_bookmark(db: Session, bookmark: Bookmark):
    """Delete bookmark"""
    db.delete(bookmark)
    db.commit()

