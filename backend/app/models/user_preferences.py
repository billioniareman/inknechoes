from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.postgres import Base


class UserPreferences(Base):
    """User preferences and settings"""
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    
    # Email notification preferences
    email_notifications_enabled = Column(Boolean, default=True)
    email_on_new_comment = Column(Boolean, default=True)
    email_on_new_follower = Column(Boolean, default=True)
    email_on_post_published = Column(Boolean, default=True)
    email_on_login = Column(Boolean, default=False)  # Security notifications
    
    # Privacy settings
    profile_visibility = Column(String, default="public")  # public, private, followers_only
    show_email = Column(Boolean, default=False)
    show_analytics = Column(Boolean, default=True)
    
    # Content preferences
    default_content_type = Column(String, default="article")  # article, poetry, book
    default_visibility = Column(String, default="public")  # public, draft
    
    # UI preferences (stored as JSON for flexibility)
    ui_preferences = Column(JSON, nullable=True)  # e.g., {"theme": "dark", "font_size": "medium"}
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    user = relationship("User", backref="preferences")

