from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.postgres import Base

# Association table for tracking user likes/claps on posts
post_likes = Table(
    'post_likes',
    Base.metadata,
    Column('post_id', Integer, ForeignKey('posts.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True)
)

post_claps = Table(
    'post_claps',
    Base.metadata,
    Column('post_id', Integer, ForeignKey('posts.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True)
)


class Post(Base):
    __tablename__ = "posts"
    
    # Metadata stored in PostgreSQL
    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    mongo_id = Column(String, nullable=False)  # Reference to MongoDB document
    visibility = Column(String, default="public")  # public or draft
    likes_count = Column(Integer, default=0)
    claps_count = Column(Integer, default=0)
    content_type = Column(String, default="article")  # article, poetry, book
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    author = relationship("User", backref="posts")
    liked_by = relationship("User", secondary=post_likes, backref="liked_posts")
    clapped_by = relationship("User", secondary=post_claps, backref="clapped_posts")

