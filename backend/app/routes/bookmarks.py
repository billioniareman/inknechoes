from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.schemas.bookmark_schema import BookmarkCreate, BookmarkResponse, BookmarkUpdate
from app.services.bookmark_service import (
    create_bookmark, get_bookmark, get_user_bookmarks, get_bookmark_for_post,
    update_bookmark, delete_bookmark
)
from app.utils.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


@router.post("", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
async def create_new_bookmark(
    bookmark_data: BookmarkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update a bookmark"""
    bookmark = create_bookmark(db, bookmark_data, current_user.id)
    return bookmark


@router.get("/me", response_model=list[BookmarkResponse])
async def get_my_bookmarks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's bookmarks"""
    bookmarks = get_user_bookmarks(db, current_user.id)
    return bookmarks


@router.get("/post/{post_id}", response_model=BookmarkResponse)
async def get_bookmark_for_post_route(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get bookmark for a specific post"""
    bookmark = get_bookmark_for_post(db, current_user.id, post_id)
    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )
    return bookmark


@router.put("/{bookmark_id}", response_model=BookmarkResponse)
async def update_bookmark_by_id(
    bookmark_id: int,
    bookmark_data: BookmarkUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update bookmark"""
    bookmark = get_bookmark(db, bookmark_id)
    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )
    
    if bookmark.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this bookmark"
        )
    
    updated_bookmark = update_bookmark(db, bookmark, bookmark_data)
    return updated_bookmark


@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bookmark_by_id(
    bookmark_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete bookmark"""
    bookmark = get_bookmark(db, bookmark_id)
    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )
    
    if bookmark.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this bookmark"
        )
    
    delete_bookmark(db, bookmark)
    return None

