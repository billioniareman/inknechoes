from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class NotificationActorInfo(BaseModel):
    """Information about the user who triggered the notification"""
    id: int
    username: str
    bio: Optional[str] = None
    
    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    """Response schema for a notification"""
    id: int
    recipient_id: int
    actor: NotificationActorInfo
    notification_type: str
    post_id: Optional[str] = None
    comment_id: Optional[int] = None
    message: str
    is_read: bool
    is_archived: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class NotificationStats(BaseModel):
    """Statistics about notifications"""
    total_count: int
    unread_count: int
    archived_count: int


class MarkAsReadRequest(BaseModel):
    """Request to mark notification(s) as read"""
    notification_ids: list[int]


class NotificationPreferences(BaseModel):
    """User notification preferences"""
    email_on_follow: bool = True
    email_on_comment: bool = True
    email_on_reply: bool = True
    email_on_like: bool = False
    email_on_mention: bool = True
    push_on_follow: bool = True
    push_on_comment: bool = True
    push_on_reply: bool = True
    push_on_like: bool = True
    push_on_mention: bool = True
