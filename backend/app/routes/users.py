from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.schemas.user_schema import UserResponse, UserUpdate
from app.services.user_service import update_user_profile
from app.services.post_service import get_user_posts
from app.schemas.post_schema import PostResponse
from app.utils.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    updated_user = update_user_profile(db, current_user, user_data)
    return updated_user


@router.get("/{username}", response_model=UserResponse)
async def get_user_profile(
    username: str,
    db: Session = Depends(get_db)
):
    """Get user profile by username"""
    from app.services.auth_service import get_user_by_username
    user = get_user_by_username(db, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.get("/{username}/posts", response_model=list[PostResponse])
async def get_user_posts_route(
    username: str,
    db: Session = Depends(get_db)
):
    """Get user's public posts"""
    from app.services.auth_service import get_user_by_username
    user = get_user_by_username(db, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    posts = get_user_posts(db, user.id, include_drafts=False)
    # Add author username and cover images to each post
    from app.services.post_service import get_post_content
    posts_with_author = []
    for post in posts:
        post_dict = post.__dict__.copy()
        post_dict['author_username'] = user.username
        
        # Get cover image from MongoDB
        try:
            content = await get_post_content(post.mongo_id)
            if content:
                post_dict['cover_image_url'] = content.cover_image_url
        except:
            post_dict['cover_image_url'] = None
        
        posts_with_author.append(PostResponse(**post_dict))
    
    return posts_with_author


@router.get("/{username}/analytics")
async def get_user_analytics_route(
    username: str,
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics for a user"""
    from app.services.auth_service import get_user_by_username
    from app.services.analytics_service import get_user_analytics
    
    user = get_user_by_username(db, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    analytics = await get_user_analytics(db, user.id)
    return analytics

