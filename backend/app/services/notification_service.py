from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification_schema import NotificationActorInfo, NotificationResponse, NotificationStats
from datetime import datetime
from typing import List, Optional


def create_notification(
    db: Session,
    recipient_id: int,
    actor_id: int,
    notification_type: str,
    message: str,
    post_id: Optional[str] = None,
    comment_id: Optional[int] = None
) -> Notification:
    """Create a new notification"""
    # Don't create notification if user is notifying themselves
    if recipient_id == actor_id:
        return None
    
    # Check for duplicate recent notifications (within last 5 minutes)
    from datetime import timedelta
    recent_duplicate = db.query(Notification).filter(
        and_(
            Notification.recipient_id == recipient_id,
            Notification.actor_id == actor_id,
            Notification.notification_type == notification_type,
            Notification.post_id == post_id,
            Notification.comment_id == comment_id,
            Notification.created_at >= datetime.utcnow() - timedelta(minutes=5)
        )
    ).first()
    
    if recent_duplicate:
        return recent_duplicate
    
    notification = Notification(
        recipient_id=recipient_id,
        actor_id=actor_id,
        notification_type=notification_type,
        message=message,
        post_id=post_id,
        comment_id=comment_id
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def get_user_notifications(
    db: Session,
    user_id: int,
    limit: int = 50,
    offset: int = 0,
    unread_only: bool = False,
    include_archived: bool = False
) -> List[Notification]:
    """Get notifications for a user"""
    query = db.query(Notification).options(
        joinedload(Notification.actor),
        joinedload(Notification.comment)
    ).filter(Notification.recipient_id == user_id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    if not include_archived:
        query = query.filter(Notification.is_archived == False)
    
    query = query.order_by(desc(Notification.created_at))
    query = query.limit(limit).offset(offset)
    
    return query.all()


def get_notification_stats(db: Session, user_id: int) -> NotificationStats:
    """Get notification statistics for a user"""
    total_count = db.query(Notification).filter(
        and_(
            Notification.recipient_id == user_id,
            Notification.is_archived == False
        )
    ).count()
    
    unread_count = db.query(Notification).filter(
        and_(
            Notification.recipient_id == user_id,
            Notification.is_read == False,
            Notification.is_archived == False
        )
    ).count()
    
    archived_count = db.query(Notification).filter(
        and_(
            Notification.recipient_id == user_id,
            Notification.is_archived == True
        )
    ).count()
    
    return NotificationStats(
        total_count=total_count,
        unread_count=unread_count,
        archived_count=archived_count
    )


def mark_notification_as_read(db: Session, notification_id: int, user_id: int) -> Optional[Notification]:
    """Mark a single notification as read"""
    notification = db.query(Notification).filter(
        and_(
            Notification.id == notification_id,
            Notification.recipient_id == user_id
        )
    ).first()
    
    if notification and not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        db.commit()
        db.refresh(notification)
    
    return notification


def mark_multiple_as_read(db: Session, notification_ids: List[int], user_id: int) -> int:
    """Mark multiple notifications as read. Returns count of updated notifications."""
    updated = db.query(Notification).filter(
        and_(
            Notification.id.in_(notification_ids),
            Notification.recipient_id == user_id,
            Notification.is_read == False
        )
    ).update(
        {
            Notification.is_read: True,
            Notification.read_at: datetime.utcnow()
        },
        synchronize_session=False
    )
    db.commit()
    return updated


def mark_all_as_read(db: Session, user_id: int) -> int:
    """Mark all unread notifications as read. Returns count of updated notifications."""
    updated = db.query(Notification).filter(
        and_(
            Notification.recipient_id == user_id,
            Notification.is_read == False
        )
    ).update(
        {
            Notification.is_read: True,
            Notification.read_at: datetime.utcnow()
        },
        synchronize_session=False
    )
    db.commit()
    return updated


def archive_notification(db: Session, notification_id: int, user_id: int) -> Optional[Notification]:
    """Archive a notification"""
    notification = db.query(Notification).filter(
        and_(
            Notification.id == notification_id,
            Notification.recipient_id == user_id
        )
    ).first()
    
    if notification:
        notification.is_archived = True
        db.commit()
        db.refresh(notification)
    
    return notification


def delete_notification(db: Session, notification_id: int, user_id: int) -> bool:
    """Delete a notification permanently"""
    notification = db.query(Notification).filter(
        and_(
            Notification.id == notification_id,
            Notification.recipient_id == user_id
        )
    ).first()
    
    if notification:
        db.delete(notification)
        db.commit()
        return True
    return False


# Helper functions for creating specific notification types

def notify_new_follower(db: Session, follower_id: int, followed_id: int):
    """Create notification when someone follows you"""
    follower = db.query(User).filter(User.id == follower_id).first()
    if follower:
        message = f"{follower.username} started following you"
        return create_notification(
            db=db,
            recipient_id=followed_id,
            actor_id=follower_id,
            notification_type="follow",
            message=message
        )


def notify_new_comment(db: Session, commenter_id: int, post_author_id: int, post_id: str, comment_id: int):
    """Create notification when someone comments on your post"""
    commenter = db.query(User).filter(User.id == commenter_id).first()
    if commenter:
        message = f"{commenter.username} commented on your post"
        return create_notification(
            db=db,
            recipient_id=post_author_id,
            actor_id=commenter_id,
            notification_type="comment",
            message=message,
            post_id=post_id,
            comment_id=comment_id
        )


def notify_comment_reply(db: Session, replier_id: int, original_commenter_id: int, post_id: str, comment_id: int):
    """Create notification when someone replies to your comment"""
    replier = db.query(User).filter(User.id == replier_id).first()
    if replier:
        message = f"{replier.username} replied to your comment"
        return create_notification(
            db=db,
            recipient_id=original_commenter_id,
            actor_id=replier_id,
            notification_type="reply",
            message=message,
            post_id=post_id,
            comment_id=comment_id
        )


def notify_post_like(db: Session, liker_id: int, post_author_id: int, post_id: str):
    """Create notification when someone likes your post"""
    liker = db.query(User).filter(User.id == liker_id).first()
    if liker:
        message = f"{liker.username} liked your post"
        return create_notification(
            db=db,
            recipient_id=post_author_id,
            actor_id=liker_id,
            notification_type="like_post",
            message=message,
            post_id=post_id
        )


def notify_comment_like(db: Session, liker_id: int, comment_author_id: int, comment_id: int, post_id: str = None):
    """Create notification when someone likes your comment"""
    liker = db.query(User).filter(User.id == liker_id).first()
    if liker:
        message = f"{liker.username} liked your comment"
        return create_notification(
            db=db,
            recipient_id=comment_author_id,
            actor_id=liker_id,
            notification_type="like_comment",
            message=message,
            post_id=post_id,
            comment_id=comment_id
        )
