from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.schemas.chapter_schema import ChapterCreate, ChapterResponse, ChapterUpdate, ChapterWithContent
from app.services.chapter_service import (
    create_chapter, get_chapter, get_chapters_by_post, get_chapter_content,
    update_chapter, delete_chapter
)
from app.services.post_service import get_post
from app.utils.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/chapters", tags=["chapters"])


@router.post("", response_model=ChapterResponse, status_code=status.HTTP_201_CREATED)
async def create_new_chapter(
    chapter_data: ChapterCreate,
    post_id: int = Query(..., description="Post ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new chapter for a book"""
    # Verify post exists and user owns it
    post = get_post(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add chapters to this post"
        )
    
    if post.content_type != "book":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chapters can only be added to book-type posts"
        )
    
    chapter = await create_chapter(db, chapter_data, post_id)
    return chapter


@router.get("/post/{post_id}", response_model=list[ChapterResponse])
async def get_chapters_for_post(
    post_id: int,
    db: Session = Depends(get_db)
):
    """Get all chapters for a post"""
    post = get_post(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    chapters = get_chapters_by_post(db, post_id)
    return chapters


@router.get("/{chapter_id}", response_model=ChapterWithContent)
async def get_chapter_by_id(
    chapter_id: int,
    db: Session = Depends(get_db)
):
    """Get chapter by ID with content"""
    chapter = get_chapter(db, chapter_id)
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chapter not found"
        )
    
    content = await get_chapter_content(chapter.mongo_id)
    if not content:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chapter content not found"
        )
    
    return ChapterWithContent(
        **chapter.__dict__,
        content=content
    )


@router.put("/{chapter_id}", response_model=ChapterResponse)
async def update_chapter_by_id(
    chapter_id: int,
    chapter_data: ChapterUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update chapter"""
    chapter = get_chapter(db, chapter_id)
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chapter not found"
        )
    
    # Verify user owns the post
    post = get_post(db, chapter.post_id)
    if post.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this chapter"
        )
    
    update_data = chapter_data.dict(exclude_unset=True)
    updated_chapter = await update_chapter(db, chapter, update_data)
    return updated_chapter


@router.delete("/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chapter_by_id(
    chapter_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete chapter"""
    chapter = get_chapter(db, chapter_id)
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chapter not found"
        )
    
    # Verify user owns the post
    post = get_post(db, chapter.post_id)
    if post.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this chapter"
        )
    
    await delete_chapter(db, chapter)
    return None

