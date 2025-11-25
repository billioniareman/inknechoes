"""
Routes for user follow/unfollow functionality.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.schemas.follow_schema import FollowerResponse, FollowStats
from app.services.follow_service import (
    follow_user, unfollow_user, is_following, 
    get_followers, get_following,
    get_follower_count, get_following_count
)
from app.services.auth_service import get_user_by_username
from app.services.notification_service import notify_new_follower
from app.utils.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/follows", tags=["follows"])


@router.post("/{username}/follow", status_code=status.HTTP_200_OK)
async def follow_user_route(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Follow a user by username"""
    # Get the user to follow
    user_to_follow = get_user_by_username(db, username)
    if not user_to_follow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Can't follow yourself
    if user_to_follow.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot follow yourself"
        )
    
    # Attempt to follow
    success = follow_user(db, current_user.id, user_to_follow.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already following this user"
        )
    
    # Create notification for the followed user
    notify_new_follower(db, follower_id=current_user.id, followed_id=user_to_follow.id)
    
    return {"message": f"Successfully followed {username}"}


@router.delete("/{username}/unfollow", status_code=status.HTTP_200_OK)
async def unfollow_user_route(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unfollow a user by username"""
    # Get the user to unfollow
    user_to_unfollow = get_user_by_username(db, username)
    if not user_to_unfollow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Attempt to unfollow
    success = unfollow_user(db, current_user.id, user_to_unfollow.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not currently following this user"
        )
    
    return {"message": f"Successfully unfollowed {username}"}


@router.get("/{username}/followers", response_model=list[FollowerResponse])
async def get_followers_route(
    username: str,
    limit: int = Query(100, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of users who follow the specified user"""
    # Get the user
    user = get_user_by_username(db, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get followers
    followers_list = get_followers(db, user.id, limit=limit, offset=offset)
    
    # Add is_following status for each follower (does current user follow them?)
    result = []
    for follower in followers_list:
        follower_data = FollowerResponse.model_validate(follower)
        follower_data.is_following = is_following(db, current_user.id, follower.id)
        result.append(follower_data)
    
    return result


@router.get("/{username}/following", response_model=list[FollowerResponse])
async def get_following_route(
    username: str,
    limit: int = Query(100, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of users that the specified user follows"""
    # Get the user
    user = get_user_by_username(db, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get following list
    following_list = get_following(db, user.id, limit=limit, offset=offset)
    
    # Add is_following status for each user (does current user follow them?)
    result = []
    for followed_user in following_list:
        user_data = FollowerResponse.model_validate(followed_user)
        user_data.is_following = is_following(db, current_user.id, followed_user.id)
        result.append(user_data)
    
    return result


@router.get("/{username}/follow-stats", response_model=FollowStats)
async def get_follow_stats_route(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get follow statistics for a user"""
    # Get the user
    user = get_user_by_username(db, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get counts
    followers_count = get_follower_count(db, user.id)
    following_count = get_following_count(db, user.id)
    is_following_user = is_following(db, current_user.id, user.id)
    
    return FollowStats(
        followers_count=followers_count,
        following_count=following_count,
        is_following=is_following_user
    )
