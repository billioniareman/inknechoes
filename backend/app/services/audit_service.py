"""
Service for audit logging
"""
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from typing import Optional
from datetime import datetime


def create_audit_log(
    db: Session,
    user_id: Optional[int],
    action: str,
    status: str = "success",
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    details: Optional[str] = None
) -> AuditLog:
    """Create an audit log entry"""
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        status=status,
        ip_address=ip_address,
        user_agent=user_agent,
        details=details
    )
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log


def get_user_audit_logs(
    db: Session,
    user_id: int,
    limit: int = 50,
    action: Optional[str] = None
) -> list[AuditLog]:
    """Get audit logs for a user"""
    query = db.query(AuditLog).filter(AuditLog.user_id == user_id)
    
    if action:
        query = query.filter(AuditLog.action == action)
    
    return query.order_by(AuditLog.created_at.desc()).limit(limit).all()

