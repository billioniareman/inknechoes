from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user_schema import UserUpdate

def update_user_profile(db: Session, user: User, user_data: UserUpdate) -> User:
    """Update user profile"""
    if user_data.bio is not None:
        user.bio = user_data.bio
    if user_data.genre_tags is not None:
        user.genre_tags = user_data.genre_tags
    
    db.commit()
    db.refresh(user)
    return user

