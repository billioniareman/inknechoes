"""
Pydantic schemas for follow-related operations.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FollowAction(BaseModel):
    """Schema for follow/unfollow actions (typically not needed since we use URL params)"""
    pass


class FollowerResponse(BaseModel):
    """Response schema for a follower/following user"""
    id: int
    username: str
    bio: Optional[str] = None
    genre_tags: Optional[str] = None
    created_at: datetime
    is_following: Optional[bool] = False  # Whether current user follows this user
    
    class Config:
        from_attributes = True


class FollowStats(BaseModel):
    """Follow statistics for a user"""
    followers_count: int
    following_count: int
    is_following: Optional[bool] = False  # Whether current user follows this user
