from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.postgres import get_db
from app.models.user import User
from app.utils.dependencies import get_current_user
from app.schemas.tag_schema import TagCreate, TagUpdate, TagResponse, TagWithPostCount, TagStats
from app.schemas.post_schema import PostResponse
from app.services import tag_service
from app.services.post_service import get_post_content

router = APIRouter(prefix="/tags", tags=["tags"])


@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
def create_tag(
    tag_data: TagCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new tag (requires authentication)"""
    tag = tag_service.create_tag(db, tag_data)
    return tag


@router.get("", response_model=List[TagResponse])
def get_tags(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all tags"""
    tags = tag_service.get_all_tags(db, skip=skip, limit=limit)
    return tags


@router.get("/search", response_model=List[TagResponse])
def search_tags(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Search tags by name (for auto-suggest)"""
    tags = tag_service.search_tags(db, q, limit=limit)
    return tags


@router.get("/popular", response_model=List[TagResponse])
def get_popular_tags(
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get most popular tags by usage count"""
    tags = tag_service.get_popular_tags(db, limit=limit)
    return tags


@router.get("/trending", response_model=List[TagWithPostCount])
def get_trending_tags(
    limit: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """Get trending tags based on current post count"""
    tags = tag_service.get_trending_tags(db, limit=limit)
    return tags


@router.get("/stats", response_model=TagStats)
def get_tag_stats(
    db: Session = Depends(get_db)
):
    """Get tag statistics"""
    total = db.query(tag_service.Tag).count()
    most_used = tag_service.get_popular_tags(db, limit=1)
    recent = db.query(tag_service.Tag).order_by(
        tag_service.Tag.created_at.desc()
    ).limit(5).all()
    
    return TagStats(
        total_tags=total,
        most_used_tag=most_used[0] if most_used else None,
        recent_tags=recent
    )


@router.get("/{tag_slug}", response_model=TagResponse)
def get_tag_by_slug(
    tag_slug: str,
    db: Session = Depends(get_db)
):
    """Get tag by slug"""
    tag = tag_service.get_tag_by_slug(db, tag_slug)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    return tag


@router.get("/{tag_slug}/posts", response_model=dict)
async def get_posts_by_tag(
    tag_slug: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all posts with a specific tag"""
    skip = (page - 1) * page_size
    posts, total = tag_service.get_posts_by_tag(db, tag_slug, skip=skip, limit=page_size)
    
    # Add author usernames and cover images
    posts_with_author = []
    for post in posts:
        author = db.query(User).filter(User.id == post.author_id).first()
        post_dict = post.__dict__.copy()
        post_dict['author_username'] = author.username if author else None
        
        # Get cover image from MongoDB
        try:
            content = await get_post_content(post.mongo_id)
            if content:
                post_dict['cover_image_url'] = content.cover_image_url
        except:
            post_dict['cover_image_url'] = None
        
        posts_with_author.append(PostResponse(**post_dict))
    
    return {
        "posts": posts_with_author,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.put("/{tag_id}", response_model=TagResponse)
def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update tag (requires authentication)"""
    # Only admins can update tags
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update tags"
        )
    
    tag = tag_service.get_tag(db, tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    tag = tag_service.update_tag(db, tag, tag_data)
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
    tag_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete tag (requires admin)"""
    # Only admins can delete tags
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete tags"
        )
    
    tag = tag_service.get_tag(db, tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    tag_service.delete_tag(db, tag)
    return None
