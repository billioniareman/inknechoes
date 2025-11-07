from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BookmarkBase(BaseModel):
    post_id: int
    chapter_id: Optional[int] = None
    page_number: int = 1
    note: Optional[str] = None


class BookmarkCreate(BookmarkBase):
    pass


class BookmarkUpdate(BaseModel):
    chapter_id: Optional[int] = None
    page_number: Optional[int] = None
    note: Optional[str] = None


class BookmarkResponse(BookmarkBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

