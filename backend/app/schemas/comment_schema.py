from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CommentBase(BaseModel):
    content: str
    parent_id: Optional[int] = None


class CommentCreate(CommentBase):
    post_id: int


class CommentUpdate(BaseModel):
    content: str


class CommentResponse(CommentBase):
    id: int
    post_id: int
    author_id: int
    likes_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    author_username: Optional[str] = None
    
    class Config:
        from_attributes = True


class CommentWithReplies(CommentResponse):
    replies: List["CommentWithReplies"] = []


CommentWithReplies.model_rebuild()

