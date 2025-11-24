from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.postgres import Base

# Association table for tracking user likes on comments
comment_likes = Table(
    'comment_likes',
    Base.metadata,
    Column('comment_id', Integer, ForeignKey('comments.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True)
)


class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)  # For nested comments
    content = Column(Text, nullable=False)
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    post = relationship("Post", backref="comments")
    author = relationship("User", backref="comments")
    parent = relationship("Comment", remote_side=[id], backref="replies")
    liked_by = relationship("User", secondary=comment_likes, backref="liked_comments")


