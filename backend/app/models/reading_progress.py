from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.postgres import Base


class ReadingProgress(Base):
    __tablename__ = "reading_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    current_page = Column(Integer, nullable=False, default=1)
    total_pages = Column(Integer, nullable=False, default=1)
    progress_percentage = Column(Float, nullable=False, default=0.0)
    last_read_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    reading_time_minutes = Column(Integer, default=0)  # Total time spent reading
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Unique constraint: one progress record per user per post
    __table_args__ = (UniqueConstraint('user_id', 'post_id', name='_user_post_progress_uc'),)
    
    # Relationships
    user = relationship("User", backref="reading_progress")
    post = relationship("Post", backref="reading_progress")

