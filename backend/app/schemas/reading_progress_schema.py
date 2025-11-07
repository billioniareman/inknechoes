from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReadingProgressBase(BaseModel):
    post_id: int
    current_page: int = 1
    total_pages: int = 1
    progress_percentage: float = 0.0
    reading_time_minutes: int = 0


class ReadingProgressCreate(ReadingProgressBase):
    pass


class ReadingProgressUpdate(BaseModel):
    current_page: Optional[int] = None
    total_pages: Optional[int] = None
    progress_percentage: Optional[float] = None
    reading_time_minutes: Optional[int] = None


class ReadingProgressResponse(ReadingProgressBase):
    id: int
    user_id: int
    last_read_at: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

