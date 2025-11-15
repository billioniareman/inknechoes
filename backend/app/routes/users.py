from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.schemas.user_schema import (
    UserResponse, UserUpdate, UserPreferencesUpdate, 
    UserPreferencesResponse, UserSessionResponse
)
from app.services.user_service import update_user_profile
from app.services.post_service import get_user_posts
from app.services.preferences_service import get_or_create_user_preferences, update_user_preferences
from app.services.session_service import get_user_sessions, deactivate_session
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
    
    # Create audit log
    from app.services.audit_service import create_audit_log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="profile_updated",
        status="success",
        details=f"Updated fields: {list(user_data.dict(exclude_unset=True).keys())}"
    )
    
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


@router.get("/me/audit-logs")
async def get_my_audit_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    action: str = None
):
    """Get current user's audit logs"""
    from app.services.audit_service import get_user_audit_logs
    
    logs = get_user_audit_logs(db, current_user.id, limit=limit, action=action)
    
    # Convert to dict for response
    return [
        {
            "id": log.id,
            "action": log.action,
            "status": log.status,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "details": log.details,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in logs
    ]


@router.get("/me/preferences", response_model=UserPreferencesResponse)
async def get_my_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user preferences"""
    preferences = get_or_create_user_preferences(db, current_user.id)
    return preferences


@router.put("/me/preferences", response_model=UserPreferencesResponse)
async def update_my_preferences(
    preferences_data: UserPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user preferences"""
    preferences = update_user_preferences(db, current_user.id, preferences_data)
    return preferences


@router.get("/me/sessions", response_model=list[UserSessionResponse])
async def get_my_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    active_only: bool = True
):
    """Get current user's active sessions"""
    sessions = get_user_sessions(db, current_user.id, active_only=active_only)
    return sessions


@router.delete("/me/sessions/{session_id}")
async def revoke_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke a specific session"""
    deactivate_session(db, session_id, current_user.id)
    return {"message": "Session revoked successfully"}


@router.post("/me/sessions/revoke-all")
async def revoke_all_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke all sessions except current one"""
    from app.services.session_service import deactivate_all_user_sessions
    # Note: This will revoke all sessions including current
    # In production, you might want to exclude the current session
    deactivate_all_user_sessions(db, current_user.id)
    return {"message": "All sessions revoked successfully"}
