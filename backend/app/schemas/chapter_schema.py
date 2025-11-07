from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ChapterContent(BaseModel):
    """Chapter content stored in MongoDB"""
    body: str


class ChapterBase(BaseModel):
    title: str
    order: int


class ChapterCreate(ChapterBase):
    content: ChapterContent


class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    order: Optional[int] = None
    content: Optional[ChapterContent] = None


class ChapterResponse(ChapterBase):
    id: int
    post_id: int
    mongo_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ChapterWithContent(ChapterResponse):
    """Chapter with full content from MongoDB"""
    content: ChapterContent

