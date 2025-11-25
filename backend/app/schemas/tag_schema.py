from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime


class TagCreate(BaseModel):
    """Schema for creating a new tag"""
    name: str
    description: Optional[str] = None
    
    @validator('name')
    def validate_name(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Tag name cannot be empty')
        if len(v) > 50:
            raise ValueError('Tag name must be 50 characters or less')
        return v.strip().lower()


class TagUpdate(BaseModel):
    """Schema for updating a tag"""
    name: Optional[str] = None
    description: Optional[str] = None
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None:
            if len(v.strip()) == 0:
                raise ValueError('Tag name cannot be empty')
            if len(v) > 50:
                raise ValueError('Tag name must be 50 characters or less')
            return v.strip().lower()
        return v


class TagResponse(BaseModel):
    """Schema for tag response"""
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    usage_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TagWithPostCount(BaseModel):
    """Tag with post count for trending tags"""
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    usage_count: int
    post_count: int  # Current posts using this tag
    
    class Config:
        from_attributes = True


class TagStats(BaseModel):
    """Statistics about tags"""
    total_tags: int
    most_used_tag: Optional[TagResponse] = None
    recent_tags: list[TagResponse] = []
