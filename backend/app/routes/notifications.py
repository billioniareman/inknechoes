from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.postgres import get_db
from app.models.user import User
from app.routes.auth import get_current_user
from app.services import notification_service
from app.schemas.notification_schema import (
    NotificationResponse,
    NotificationStats,
    NotificationActorInfo,
    MarkAsReadRequest
)

router = APIRouter(tags=["notifications"])


@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    unread_only: bool = Query(False),
    include_archived: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get notifications for the current user.
    
    - **limit**: Maximum number of notifications to return (1-100)
    - **offset**: Number of notifications to skip
    - **unread_only**: If true, only return unread notifications
    - **include_archived**: If true, include archived notifications
    """
    notifications = notification_service.get_user_notifications(
        db=db,
        user_id=current_user.id,
        limit=limit,
        offset=offset,
        unread_only=unread_only,
        include_archived=include_archived
    )
    
    # Convert to response format
    result = []
    for notification in notifications:
        actor_info = NotificationActorInfo(
            id=notification.actor.id,
            username=notification.actor.username,
            bio=notification.actor.bio
        )
        
        result.append(NotificationResponse(
            id=notification.id,
            recipient_id=notification.recipient_id,
            actor=actor_info,
            notification_type=notification.notification_type,
            post_id=notification.post_id,
            comment_id=notification.comment_id,
            message=notification.message,
            is_read=notification.is_read,
            is_archived=notification.is_archived,
            created_at=notification.created_at,
            read_at=notification.read_at
        ))
    
    return result


@router.get("/notifications/stats", response_model=NotificationStats)
def get_notification_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get notification statistics for the current user."""
    return notification_service.get_notification_stats(db, current_user.id)


@router.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a single notification as read."""
    notification = notification_service.mark_notification_as_read(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id
    )
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return {"message": "Notification marked as read"}


@router.put("/notifications/read")
def mark_notifications_read(
    request: MarkAsReadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark multiple notifications as read."""
    count = notification_service.mark_multiple_as_read(
        db=db,
        notification_ids=request.notification_ids,
        user_id=current_user.id
    )
    
    return {"message": f"Marked {count} notification(s) as read"}


@router.put("/notifications/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read."""
    count = notification_service.mark_all_as_read(db=db, user_id=current_user.id)
    return {"message": f"Marked {count} notification(s) as read"}


@router.put("/notifications/{notification_id}/archive")
def archive_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Archive a notification."""
    notification = notification_service.archive_notification(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id
    )
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return {"message": "Notification archived"}


@router.delete("/notifications/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a notification permanently."""
    success = notification_service.delete_notification(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return {"message": "Notification deleted"}
