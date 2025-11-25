from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.postgres import Base


class Notification(Base):
    """
    Notification model for tracking user notifications.
    
    Notification Types:
    - follow: User followed you
    - comment: User commented on your post
    - reply: User replied to your comment
    - like_post: User liked your post
    - like_comment: User liked your comment
    - mention: User mentioned you in a post or comment
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    notification_type = Column(String(50), nullable=False)  # follow, comment, reply, like_post, like_comment, mention
    
    # Optional: Reference to the resource that triggered the notification
    post_id = Column(String, nullable=True)  # MongoDB post ID
    comment_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    
    # Notification content
    message = Column(Text, nullable=False)
    
    # Status
    is_read = Column(Boolean, default=False, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    recipient = relationship("User", foreign_keys=[recipient_id], backref="received_notifications")
    actor = relationship("User", foreign_keys=[actor_id], backref="sent_notifications")
    comment = relationship("Comment", foreign_keys=[comment_id], backref="notifications")
    
    def __repr__(self):
        return f"<Notification {self.id}: {self.notification_type} from {self.actor_id} to {self.recipient_id}>"
