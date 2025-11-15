import bcrypt
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user_schema import UserCreate
from app.utils.jwt_handler import create_access_token, create_refresh_token
from datetime import timedelta, datetime, timezone
from app.config import get_settings

settings = get_settings()

# Account lockout settings
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 30


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


def get_password_hash(password: str) -> str:
    """Hash password using bcrypt"""
    # Generate salt and hash password
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def create_user(db: Session, user: UserCreate) -> User:
    """Create new user"""
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        bio=user.bio,
        genre_tags=user.genre_tags
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def is_account_locked(user: User) -> bool:
    """Check if account is locked"""
    if not user.locked_until:
        return False
    if user.locked_until > datetime.now(timezone.utc):
        return True
    # Lock expired, reset
    user.locked_until = None
    user.failed_login_attempts = 0
    return False


def reset_failed_login_attempts(db: Session, user: User):
    """Reset failed login attempts after successful login"""
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()


def increment_failed_login_attempts(db: Session, user: User):
    """Increment failed login attempts and lock account if threshold reached"""
    user.failed_login_attempts += 1
    
    if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
        # Lock account
        user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
    
    db.commit()


def authenticate_user(db: Session, email: str, password: str) -> tuple[User | None, str]:
    """
    Authenticate user and return user if valid.
    Returns tuple: (user or None, error_message)
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None, "Invalid email or password"
    
    # Check if account is locked
    if is_account_locked(user):
        return None, f"Account is locked. Try again after {user.locked_until.strftime('%Y-%m-%d %H:%M:%S')} UTC"
    
    if not verify_password(password, user.hashed_password):
        increment_failed_login_attempts(db, user)
        remaining_attempts = MAX_FAILED_ATTEMPTS - user.failed_login_attempts
        if remaining_attempts > 0:
            return None, f"Invalid email or password. {remaining_attempts} attempts remaining."
        else:
            return None, f"Account locked due to too many failed attempts. Try again after {LOCKOUT_DURATION_MINUTES} minutes."
    
    # Successful login - reset failed attempts
    reset_failed_login_attempts(db, user)
    return user, None


def get_user_by_email(db: Session, email: str) -> User | None:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str) -> User | None:
    """Get user by username"""
    return db.query(User).filter(User.username == username).first()


def update_user_password(db: Session, user: User, new_password: str):
    """Update user password"""
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    db.refresh(user)


def change_user_password(db: Session, user: User, current_password: str, new_password: str) -> tuple[bool, str]:
    """
    Change user password with current password verification.
    Returns tuple: (success, error_message)
    """
    if not verify_password(current_password, user.hashed_password):
        return False, "Current password is incorrect"
    
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    db.refresh(user)
    return True, None


def verify_user_email(db: Session, user: User):
    """Mark user email as verified"""
    user.email_verified = True
    db.commit()
    db.refresh(user)


def delete_user_account(db: Session, user: User):
    """
    Delete user account and cascade delete related data.
    Note: This should be called after verifying password.
    """
    user_id = user.id
    user_email = user.email
    user_username = user.username
    
    # Delete user's posts (cascade will handle related data)
    from app.models.post import Post
    from app.models.comment import Comment
    from app.models.bookmark import Bookmark
    from app.models.reading_progress import ReadingProgress
    from app.database.mongo import get_mongo_db
    from bson import ObjectId
    
    # Get all user posts
    user_posts = db.query(Post).filter(Post.author_id == user_id).all()
    
    # Delete post content from MongoDB
    mongo_db = get_mongo_db()
    for post in user_posts:
        try:
            mongo_db.posts.delete_one({"_id": ObjectId(post.mongo_id)})
        except:
            pass
    
    # Delete chapters from MongoDB
    from app.models.chapter import Chapter
    user_chapters = db.query(Chapter).filter(Chapter.post_id.in_([p.id for p in user_posts])).all()
    for chapter in user_chapters:
        try:
            mongo_db.chapters.delete_one({"_id": ObjectId(chapter.mongo_id)})
        except:
            pass
    
    # Delete comments
    db.query(Comment).filter(Comment.author_id == user_id).delete()
    
    # Delete bookmarks
    db.query(Bookmark).filter(Bookmark.user_id == user_id).delete()
    
    # Delete reading progress
    db.query(ReadingProgress).filter(ReadingProgress.user_id == user_id).delete()
    
    # Delete posts (cascade will handle chapters)
    db.query(Post).filter(Post.author_id == user_id).delete()
    
    # Delete user
    db.delete(user)
    db.commit()
    
    return user_email, user_username

