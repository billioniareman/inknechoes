from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.schemas.user_schema import (
    UserCreate, UserLogin, UserResponse, Token, PasswordReset, PasswordResetConfirm,
    EmailVerification, ChangePassword, AccountDeletion
)
from app.services.auth_service import (
    create_user, authenticate_user, get_user_by_email, update_user_password,
    verify_user_email, change_user_password, delete_user_account, verify_password
)
from app.utils.jwt_handler import create_access_token, create_refresh_token, verify_token
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.utils.email_utils import (
    send_password_reset_email, send_welcome_email, send_email_verification_email,
    send_password_change_notification, send_login_notification, send_account_deletion_confirmation
)
from app.services.audit_service import create_audit_log
from app.services.token_service import (
    create_token, get_token, mark_token_as_used, delete_token, delete_user_tokens
)
from app.models.verification_token import TokenType
from datetime import timedelta
from app.config import get_settings
import secrets

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if email already exists
    if get_user_by_email(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    from app.services.auth_service import get_user_by_username
    if get_user_by_username(db, user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    user = create_user(db, user_data)
    
    # Generate email verification token
    verification_token = secrets.token_urlsafe(32)
    
    # Store verification token in PostgreSQL (24 hours expiry)
    try:
        create_token(
            db=db,
            user_id=user.id,
            token=verification_token,
            token_type=TokenType.EMAIL_VERIFICATION,
            expires_in_seconds=86400  # 24 hours
        )
    except Exception as e:
        print(f"[WARNING] Failed to store email verification token: {e}")
        print(f"[DEV] Email verification token for {user.email}: {verification_token}")
    
    # Send verification email
    await send_email_verification_email(user.email, user.username, verification_token)
    
    # Send welcome email
    await send_welcome_email(user.email, user.username)
    
    # Create audit log
    create_audit_log(
        db=db,
        user_id=user.id,
        action="user_registered",
        status="success",
        details=f"Email: {user.email}, Username: {user.username}"
    )
    
    return user


@router.post("/login", response_model=Token)
async def login(
    user_data: UserLogin,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    """Login user and return JWT tokens"""
    # Get IP address and user agent for audit logging
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    user, error_message = authenticate_user(db, user_data.email, user_data.password)
    if not user:
        # Create audit log for failed login
        create_audit_log(
            db=db,
            user_id=None,
            action="login_attempt",
            status="failed",
            ip_address=ip_address,
            user_agent=user_agent,
            details=f"Email: {user_data.email}, Error: {error_message}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_message
        )
    
    # Check if email is verified (optional - can be enforced later)
    # if not user.email_verified:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Please verify your email address before logging in"
    #     )
    
    # Create tokens (sub must be a string for JWT)
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Store refresh token in PostgreSQL
    try:
        create_token(
            db=db,
            user_id=user.id,
            token=refresh_token,
            token_type=TokenType.REFRESH_TOKEN,
            expires_in_seconds=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        )
    except Exception as e:
        print(f"[WARNING] Failed to store refresh token: {e}")
    
    # Get origin from request for cookie domain (if needed)
    origin = request.headers.get("origin")
    
    # Set HTTP-only cookies with explicit path
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.ENV == "production",  # HTTPS only in production
        samesite="lax",  # Changed from "none" to "lax" for better compatibility
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
        # Don't set domain - let browser handle it automatically
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.ENV == "production",
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/"
    )
    
    # Create user session
    from app.services.session_service import create_user_session
    try:
        # Extract device info from user agent (simplified)
        device_info = None
        if user_agent:
            if "Chrome" in user_agent:
                device_info = "Chrome"
            elif "Firefox" in user_agent:
                device_info = "Firefox"
            elif "Safari" in user_agent:
                device_info = "Safari"
            elif "Edge" in user_agent:
                device_info = "Edge"
        
        create_user_session(
            db=db,
            user_id=user.id,
            refresh_token=refresh_token,
            ip_address=ip_address,
            user_agent=user_agent,
            device_info=device_info
        )
    except Exception as e:
        print(f"[WARNING] Failed to create user session: {e}")
    
    # Create audit log for successful login
    create_audit_log(
        db=db,
        user_id=user.id,
        action="login",
        status="success",
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    # Send login notification (optional - can be made configurable)
    # Check user preferences first
    from app.services.preferences_service import get_or_create_user_preferences
    try:
        preferences = get_or_create_user_preferences(db, user.id)
        if preferences.email_on_login:
            await send_login_notification(user.email, user.username, ip_address, user_agent)
    except:
        pass  # If preferences don't exist yet, skip notification
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout user"""
    # Get refresh token from cookie to deactivate session
    refresh_token = request.cookies.get("refresh_token")
    
    # Deactivate session if exists
    if refresh_token:
        from app.services.session_service import get_user_session_by_token, deactivate_session
        try:
            session = get_user_session_by_token(db, current_user.id, refresh_token)
            if session:
                deactivate_session(db, session.id, current_user.id)
        except Exception as e:
            print(f"[WARNING] Failed to deactivate session: {e}")
    
    # Remove refresh token from PostgreSQL
    try:
        delete_user_tokens(db, current_user.id, TokenType.REFRESH_TOKEN)
    except Exception as e:
        print(f"[WARNING] Failed to delete refresh token: {e}")
    
    # Create audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="logout",
        status="success"
    )
    
    # Clear cookies with explicit path
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    
    return {"message": "Logged out successfully"}


@router.post("/refresh", response_model=Token)
async def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Refresh access token"""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token required"
        )
    
    payload = verify_token(refresh_token, token_type="refresh")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    
    # Verify refresh token in PostgreSQL
    try:
        stored_token = get_token(db, refresh_token, TokenType.REFRESH_TOKEN)
        if not stored_token or stored_token.user_id != int(user_id):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[WARNING] Error during token verification: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Create new access token (sub must be a string for JWT)
    new_access_token = create_access_token(data={"sub": str(user_id)})
    
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=settings.ENV == "production",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    
    return {"access_token": new_access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user


@router.post("/password-reset")
async def request_password_reset(
    password_reset: PasswordReset,
    db: Session = Depends(get_db)
):
    """Request password reset"""
    user = get_user_by_email(db, password_reset.email)
    if not user:
        # Don't reveal if email exists
        return {"message": "If email exists, reset link has been sent"}
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    
    # Store reset token in PostgreSQL (1 hour expiry)
    try:
        create_token(
            db=db,
            user_id=user.id,
            token=reset_token,
            token_type=TokenType.PASSWORD_RESET,
            expires_in_seconds=3600  # 1 hour
        )
        print(f"[INFO] Password reset token stored for user {user.id} (email: {user.email})")
    except Exception as e:
        print(f"[WARNING] Failed to store password reset token: {e}")
        print(f"[DEV] Password reset token for {user.email}: {reset_token}")
    
    await send_password_reset_email(user.email, reset_token)
    return {"message": "If email exists, reset link has been sent"}


@router.post("/password-reset/confirm")
async def confirm_password_reset(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """Confirm password reset"""
    # Get token from PostgreSQL
    verification_token = get_token(db, reset_data.token, TokenType.PASSWORD_RESET)
    
    if not verification_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token. Please request a new password reset link."
        )
    
    user = db.query(User).filter(User.id == verification_token.user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    update_user_password(db, user, reset_data.new_password)
    
    # Create audit log
    create_audit_log(
        db=db,
        user_id=user.id,
        action="password_reset",
        status="success"
    )
    
    # Mark token as used (one-time use)
    try:
        mark_token_as_used(db, reset_data.token, TokenType.PASSWORD_RESET)
        print(f"[INFO] Password reset token marked as used")
    except Exception as e:
        print(f"[WARNING] Failed to mark reset token as used: {e}")
    
    return {"message": "Password reset successfully"}


@router.post("/verify-email")
async def verify_email(
    verification_data: EmailVerification,
    db: Session = Depends(get_db)
):
    """Verify user email address"""
    # Get token from PostgreSQL
    verification_token = get_token(db, verification_data.token, TokenType.EMAIL_VERIFICATION)
    
    if not verification_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    user = db.query(User).filter(User.id == verification_token.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.email_verified:
        return {"message": "Email already verified"}
    
    verify_user_email(db, user)
    
    # Create audit log
    create_audit_log(
        db=db,
        user_id=user.id,
        action="email_verified",
        status="success"
    )
    
    # Mark token as used (one-time use)
    try:
        mark_token_as_used(db, verification_data.token, TokenType.EMAIL_VERIFICATION)
    except Exception as e:
        print(f"[WARNING] Failed to mark verification token as used: {e}")
    
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
async def resend_verification_email(
    password_reset: PasswordReset,  # Reuse schema - just needs email
    db: Session = Depends(get_db)
):
    """Resend email verification email"""
    user = get_user_by_email(db, password_reset.email)
    if not user:
        # Don't reveal if email exists
        return {"message": "If email exists and is unverified, verification email has been sent"}
    
    if user.email_verified:
        return {"message": "Email already verified"}
    
    # Generate new verification token
    verification_token = secrets.token_urlsafe(32)
    
    # Store verification token in PostgreSQL (24 hours expiry)
    try:
        create_token(
            db=db,
            user_id=user.id,
            token=verification_token,
            token_type=TokenType.EMAIL_VERIFICATION,
            expires_in_seconds=86400  # 24 hours
        )
    except Exception as e:
        print(f"[WARNING] Failed to store email verification token: {e}")
        print(f"[DEV] Email verification token for {user.email}: {verification_token}")
    
    await send_email_verification_email(user.email, user.username, verification_token)
    
    return {"message": "If email exists and is unverified, verification email has been sent"}


@router.post("/change-password")
async def change_password(
    password_data: ChangePassword,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change password while logged in"""
    ip_address = request.client.host if request and request.client else None
    user_agent = request.headers.get("user-agent") if request else None
    
    success, error_message = change_user_password(
        db, current_user, password_data.current_password, password_data.new_password
    )
    
    if not success:
        # Create audit log for failed password change
        create_audit_log(
            db=db,
            user_id=current_user.id,
            action="password_change",
            status="failed",
            ip_address=ip_address,
            user_agent=user_agent,
            details=f"Error: {error_message}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Create audit log for successful password change
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="password_change",
        status="success",
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    # Send notification email
    await send_password_change_notification(current_user.email, current_user.username)
    
    return {"message": "Password changed successfully"}


@router.delete("/account")
async def delete_account(
    deletion_data: AccountDeletion,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user account (self-service)"""
    ip_address = request.client.host if request and request.client else None
    user_agent = request.headers.get("user-agent") if request else None
    
    # Verify password before deletion
    from app.services.auth_service import verify_password
    if not verify_password(deletion_data.password, current_user.hashed_password):
        # Create audit log for failed deletion attempt
        create_audit_log(
            db=db,
            user_id=current_user.id,
            action="account_deletion",
            status="failed",
            ip_address=ip_address,
            user_agent=user_agent,
            details="Incorrect password"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    
    # Store user info before deletion
    user_email, user_username = delete_user_account(db, current_user)
    
    # Create audit log for successful deletion
    create_audit_log(
        db=db,
        user_id=None,  # User is deleted, so no user_id
        action="account_deleted",
        status="success",
        ip_address=ip_address,
        user_agent=user_agent,
        details=f"Email: {user_email}, Username: {user_username}"
    )
    
    # Send confirmation email
    await send_account_deletion_confirmation(user_email, user_username)
    
    return {"message": "Account deleted successfully"}

