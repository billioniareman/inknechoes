from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.postgres import Base


class AuditLog(Base):
    """Audit log for tracking sensitive user actions"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable for system actions
    action = Column(String, nullable=False, index=True)  # e.g., "login", "password_change", "email_verified"
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    details = Column(Text, nullable=True)  # JSON string for additional details
    status = Column(String, nullable=False, default="success")  # success, failed, error
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationship
    user = relationship("User", backref="audit_logs")

