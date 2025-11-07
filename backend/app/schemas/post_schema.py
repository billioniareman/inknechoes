from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PostContent(BaseModel):
    """Content stored in MongoDB"""
    body: str
    tags: List[str] = []
    cover_image_url: Optional[str] = None  # For book cover image
    description: Optional[str] = None  # For book description


class PostBase(BaseModel):
    title: str
    slug: str
    visibility: str = "public"  # public or draft
    content_type: str = "article"  # article, poetry, book


class PostCreate(PostBase):
    content: PostContent


class PostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[PostContent] = None
    visibility: Optional[str] = None
    content_type: Optional[str] = None


class PostResponse(PostBase):
    id: int
    author_id: int
    author_username: Optional[str] = None  # Author username for display
    mongo_id: str
    likes_count: int = 0
    claps_count: int = 0
    cover_image_url: Optional[str] = None  # Cover image for display in lists
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PostWithContent(PostResponse):
    """Post with full content from MongoDB"""
    content: PostContent


class PostListResponse(BaseModel):
    posts: List[PostResponse]
    total: int
    page: int
    page_size: int

