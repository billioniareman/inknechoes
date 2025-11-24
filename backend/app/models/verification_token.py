from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.postgres import Base
import enum


class TokenType(str, enum.Enum):
    """Types of verification tokens"""
    EMAIL_VERIFICATION = "email_verification"
    PASSWORD_RESET = "password_reset"
    REFRESH_TOKEN = "refresh_token"


class VerificationToken(Base):
    """Store verification tokens (email verification, password reset, refresh tokens)"""
    __tablename__ = "verification_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token = Column(String, nullable=False, unique=True, index=True)
    token_type = Column(SQLEnum(TokenType), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    used_at = Column(DateTime(timezone=True), nullable=True)  # Track when token was used
    
    # Relationship
    user = relationship("User", backref="verification_tokens")

