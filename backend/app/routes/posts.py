from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.schemas.post_schema import PostCreate, PostResponse, PostUpdate, PostWithContent, PostListResponse
from app.services.post_service import (
    create_post, get_post, get_post_by_slug, get_post_content,
    update_post, delete_post, get_public_posts, get_user_posts
)
from app.utils.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/posts", tags=["posts"])

@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_new_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new post"""
    # Check if slug already exists
    existing_post = get_post_by_slug(db, post_data.slug)
    if existing_post:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slug already exists"
        )
    
    post = await create_post(db, post_data, current_user.id)  # Add await here
    return post 

@router.get("", response_model=PostListResponse)
async def get_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("latest", regex="^(latest|most_appreciated)$"),
    search: Optional[str] = Query(None, description="Search query for post titles"),
    content_type: Optional[str] = Query(None, description="Filter by content type (article, poetry, book)"),
    db: Session = Depends(get_db)
):
    """Get public posts with pagination, search, and filtering"""
    skip = (page - 1) * page_size
    posts, total = get_public_posts(db, skip=skip, limit=page_size, sort_by=sort_by, search=search, content_type=content_type)
    
    # Add author usernames and cover images to posts
    from app.models.user import User
    from app.services.post_service import get_post_content
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
    
    return PostListResponse(
        posts=posts_with_author,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/me", response_model=list[PostResponse])
async def get_my_posts(
    include_drafts: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's posts"""
    posts = get_user_posts(db, current_user.id, include_drafts=include_drafts)
    return posts


@router.get("/{post_id}", response_model=PostWithContent)
async def get_post_by_id(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get post by ID with content"""
    post = get_post(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # If post is a draft, only the author or admin can access it
    if post.visibility == "draft":
        if post.author_id != current_user.id and not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this draft"
            )
    
    content = await get_post_content(post.mongo_id)
    if not content:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Post content not found"
        )
    
    # Add author username
    from app.models.user import User
    author = db.query(User).filter(User.id == post.author_id).first()
    post_dict = post.__dict__.copy()
    post_dict['author_username'] = author.username if author else None
    
    return PostWithContent(
        **post_dict,
        content=content
    )


@router.get("/slug/{slug}", response_model=PostWithContent)
async def get_post_by_slug_route(
    slug: str,
    db: Session = Depends(get_db)
):
    """Get post by slug with content"""
    post = get_post_by_slug(db, slug)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.visibility == "draft":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    content = await get_post_content(post.mongo_id)
    if not content:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Post content not found"
        )
    
    # Add author username
    from app.models.user import User
    author = db.query(User).filter(User.id == post.author_id).first()
    post_dict = post.__dict__.copy()
    post_dict['author_username'] = author.username if author else None
    
    return PostWithContent(
        **post_dict,
        content=content
    )


@router.put("/{post_id}", response_model=PostResponse)
async def update_post_by_id(
    post_id: int,
    post_data: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update post"""
    post = get_post(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this post"
        )
    
    update_data = post_data.dict(exclude_unset=True)
    updated_post = await update_post(db, post, update_data)
    return updated_post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post_by_id(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete post"""
    post = get_post(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this post"
        )
    
    await delete_post(db, post)
    return None


@router.post("/{post_id}/like", response_model=PostResponse)
async def like_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Like a post (toggle)"""
    post = get_post(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.visibility == "draft":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check if user already liked
    if current_user in post.liked_by:
        # Unlike
        post.liked_by.remove(current_user)
        post.likes_count = max(0, post.likes_count - 1)
    else:
        # Like
        post.liked_by.append(current_user)
        post.likes_count += 1
    
    db.commit()
    db.refresh(post)
    return post


@router.post("/{post_id}/clap", response_model=PostResponse)
async def clap_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clap for a post (adds to count, can clap multiple times)"""
    post = get_post(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.visibility == "draft":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Add clap (users can clap multiple times)
    post.claps_count += 1
    if current_user not in post.clapped_by:
        post.clapped_by.append(current_user)
    
    db.commit()
    db.refresh(post)
    return post


@router.get("/{post_id}/engagement")
async def get_post_engagement(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's engagement status for a post"""
    post = get_post(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    is_liked = current_user in post.liked_by if current_user else False
    has_clapped = current_user in post.clapped_by if current_user else False
    
    return {
        "is_liked": is_liked,
        "has_clapped": has_clapped,
        "likes_count": post.likes_count,
        "claps_count": post.claps_count
    }

