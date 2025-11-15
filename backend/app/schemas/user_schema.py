from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    username: str
    bio: Optional[str] = None
    genre_tags: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    bio: Optional[str] = None
    genre_tags: Optional[str] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    email_verified: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class PasswordReset(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class EmailVerification(BaseModel):
    token: str


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


class AccountDeletion(BaseModel):
    password: str  # Require password confirmation for account deletion


class UserPreferencesUpdate(BaseModel):
    email_notifications_enabled: Optional[bool] = None
    email_on_new_comment: Optional[bool] = None
    email_on_new_follower: Optional[bool] = None
    email_on_post_published: Optional[bool] = None
    email_on_login: Optional[bool] = None
    profile_visibility: Optional[str] = None  # public, private, followers_only
    show_email: Optional[bool] = None
    show_analytics: Optional[bool] = None
    default_content_type: Optional[str] = None
    default_visibility: Optional[str] = None
    ui_preferences: Optional[dict] = None


class UserPreferencesResponse(BaseModel):
    email_notifications_enabled: bool
    email_on_new_comment: bool
    email_on_new_follower: bool
    email_on_post_published: bool
    email_on_login: bool
    profile_visibility: str
    show_email: bool
    show_analytics: bool
    default_content_type: str
    default_visibility: str
    ui_preferences: Optional[dict] = None
    
    class Config:
        from_attributes = True


class UserSessionResponse(BaseModel):
    id: int
    ip_address: Optional[str]
    user_agent: Optional[str]
    device_info: Optional[str]
    location: Optional[str]
    is_active: bool
    last_activity: datetime
    created_at: datetime
    expires_at: datetime
    
    class Config:
        from_attributes = True
