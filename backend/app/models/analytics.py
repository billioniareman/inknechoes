from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.postgres import Base

class PageView(Base):
    """
    Model to track page views on posts.
    """
    __tablename__ = "page_views"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Analytics data
    ip_hash = Column(String, nullable=True)  # Hashed IP for unique visitor counting
    user_agent = Column(String, nullable=True)
    referer = Column(String, nullable=True)
    
    # Time tracking
    time_spent = Column(Float, default=0.0)  # Time spent in seconds
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    post = relationship("Post", backref="views")
    user = relationship("User", backref="viewed_pages")

    def __repr__(self):
        return f"<PageView post={self.post_id} user={self.user_id}>"
