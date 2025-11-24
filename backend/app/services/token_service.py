from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta, timezone
from app.models.verification_token import VerificationToken, TokenType
from typing import Optional


def create_token(
    db: Session,
    user_id: int,
    token: str,
    token_type: TokenType,
    expires_in_seconds: int
) -> VerificationToken:
    """Create a new verification token"""
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in_seconds)
    
    # Delete any existing tokens of the same type for this user (one active token per type)
    if token_type in [TokenType.EMAIL_VERIFICATION, TokenType.PASSWORD_RESET]:
        db.query(VerificationToken).filter(
            and_(
                VerificationToken.user_id == user_id,
                VerificationToken.token_type == token_type,
                VerificationToken.used_at.is_(None),
                VerificationToken.expires_at > datetime.now(timezone.utc)
            )
        ).delete()
    
    verification_token = VerificationToken(
        user_id=user_id,
        token=token,
        token_type=token_type,
        expires_at=expires_at
    )
    db.add(verification_token)
    db.commit()
    db.refresh(verification_token)
    return verification_token


def get_token(
    db: Session,
    token: str,
    token_type: TokenType
) -> Optional[VerificationToken]:
    """Get a verification token if it exists and is valid"""
    verification_token = db.query(VerificationToken).filter(
        and_(
            VerificationToken.token == token,
            VerificationToken.token_type == token_type,
            VerificationToken.used_at.is_(None),
            VerificationToken.expires_at > datetime.now(timezone.utc)
        )
    ).first()
    return verification_token


def get_token_by_user_id(
    db: Session,
    user_id: int,
    token_type: TokenType
) -> Optional[VerificationToken]:
    """Get a verification token by user_id and type"""
    verification_token = db.query(VerificationToken).filter(
        and_(
            VerificationToken.user_id == user_id,
            VerificationToken.token_type == token_type,
            VerificationToken.used_at.is_(None),
            VerificationToken.expires_at > datetime.now(timezone.utc)
        )
    ).order_by(VerificationToken.created_at.desc()).first()
    return verification_token


def mark_token_as_used(
    db: Session,
    token: str,
    token_type: TokenType
) -> bool:
    """Mark a token as used (one-time use tokens)"""
    verification_token = get_token(db, token, token_type)
    if verification_token:
        verification_token.used_at = datetime.now(timezone.utc)
        db.commit()
        return True
    return False


def delete_token(
    db: Session,
    token: str,
    token_type: TokenType
) -> bool:
    """Delete a token"""
    verification_token = db.query(VerificationToken).filter(
        and_(
            VerificationToken.token == token,
            VerificationToken.token_type == token_type
        )
    ).first()
    if verification_token:
        db.delete(verification_token)
        db.commit()
        return True
    return False


def delete_user_tokens(
    db: Session,
    user_id: int,
    token_type: TokenType
) -> int:
    """Delete all tokens of a specific type for a user"""
    count = db.query(VerificationToken).filter(
        and_(
            VerificationToken.user_id == user_id,
            VerificationToken.token_type == token_type
        )
    ).delete()
    db.commit()
    return count


def cleanup_expired_tokens(db: Session) -> int:
    """Delete all expired tokens"""
    count = db.query(VerificationToken).filter(
        VerificationToken.expires_at < datetime.now(timezone.utc)
    ).delete()
    db.commit()
    return count

