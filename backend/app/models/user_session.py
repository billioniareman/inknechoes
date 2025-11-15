from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.postgres import Base


class UserSession(Base):
    """Track active user sessions"""
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String, nullable=False, index=True)  # Hash of refresh token
    ip_address = Column(String, nullable=True)
    user_agent = Column(Text, nullable=True)
    device_info = Column(String, nullable=True)  # e.g., "Chrome on Windows"
    location = Column(String, nullable=True)  # Can be populated from IP geolocation
    is_active = Column(Boolean, default=True)
    last_activity = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # Relationship
    user = relationship("User", backref="sessions")

