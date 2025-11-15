"""
Service for managing user sessions
"""
from sqlalchemy.orm import Session
from app.models.user_session import UserSession
from app.models.user import User
from datetime import datetime, timedelta, timezone
from app.config import get_settings
import hashlib

settings = get_settings()


def hash_token(token: str) -> str:
    """Hash a token for storage"""
    return hashlib.sha256(token.encode()).hexdigest()


def create_user_session(
    db: Session,
    user_id: int,
    refresh_token: str,
    ip_address: str = None,
    user_agent: str = None,
    device_info: str = None,
    location: str = None
) -> UserSession:
    """Create a new user session"""
    token_hash = hash_token(refresh_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    session = UserSession(
        user_id=user_id,
        token_hash=token_hash,
        ip_address=ip_address,
        user_agent=user_agent,
        device_info=device_info,
        location=location,
        expires_at=expires_at
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_user_session_by_token(
    db: Session,
    user_id: int,
    refresh_token: str
) -> UserSession | None:
    """Get user session by token hash"""
    token_hash = hash_token(refresh_token)
    return db.query(UserSession).filter(
        UserSession.user_id == user_id,
        UserSession.token_hash == token_hash,
        UserSession.is_active == True
    ).first()


def update_session_activity(db: Session, session: UserSession):
    """Update session last activity"""
    session.last_activity = datetime.now(timezone.utc)
    db.commit()


def deactivate_session(db: Session, session_id: int, user_id: int):
    """Deactivate a session"""
    session = db.query(UserSession).filter(
        UserSession.id == session_id,
        UserSession.user_id == user_id
    ).first()
    
    if session:
        session.is_active = False
        db.commit()


def deactivate_all_user_sessions(db: Session, user_id: int):
    """Deactivate all sessions for a user"""
    db.query(UserSession).filter(
        UserSession.user_id == user_id,
        UserSession.is_active == True
    ).update({"is_active": False})
    db.commit()


def get_user_sessions(
    db: Session,
    user_id: int,
    active_only: bool = True
) -> list[UserSession]:
    """Get all sessions for a user"""
    query = db.query(UserSession).filter(UserSession.user_id == user_id)
    
    if active_only:
        query = query.filter(UserSession.is_active == True)
    
    return query.order_by(UserSession.last_activity.desc()).all()


def cleanup_expired_sessions(db: Session):
    """Clean up expired sessions"""
    now = datetime.now(timezone.utc)
    db.query(UserSession).filter(
        UserSession.expires_at < now
    ).update({"is_active": False})
    db.commit()

