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
from app.database.redis import get_redis
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
    
    # Store verification token in Redis (24 hours expiry)
    from app.database.redis import is_redis_available
    if is_redis_available():
        redis_client = get_redis()
        try:
            redis_client.setex(f"email_verify:{verification_token}", 86400, str(user.id))  # 24 hours
        except Exception as e:
            print(f"[WARNING] Failed to store email verification token in Redis: {e}")
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
    
    # Store refresh token in Redis (if available)
    from app.database.redis import is_redis_available
    if is_redis_available():
        redis_client = get_redis()
        try:
            redis_client.setex(
                f"refresh_token:{user.id}",
                settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
                refresh_token
            )
        except Exception as e:
            print(f"[WARNING] Failed to store refresh token in Redis: {e}")
    
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
    
    # Remove refresh token from Redis (if available)
    from app.database.redis import is_redis_available
    if is_redis_available():
        redis_client = get_redis()
        try:
            redis_client.delete(f"refresh_token:{current_user.id}")
        except Exception as e:
            print(f"[WARNING] Failed to delete refresh token from Redis: {e}")
    
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
    
    # Verify refresh token in Redis (if available)
    # If Redis is not available, we accept the token if it's a valid JWT (dev mode)
    from app.database.redis import is_redis_available
    if is_redis_available():
        redis_client = get_redis()
        try:
            stored_token = redis_client.get(f"refresh_token:{user_id}")
            # Only reject if Redis has a stored token AND it doesn't match
            # If no stored token exists (None), accept it (might be first time or Redis was cleared)
            if stored_token is not None and stored_token != refresh_token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid refresh token"
                )
        except Exception as e:
            print(f"[WARNING] Redis error during token verification: {e}")
            # Continue without Redis verification in dev mode
    # If Redis is not available, we accept the token if it's valid JWT (already verified above)
    # This allows the app to work in dev mode without Redis
    
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
    
    # Store reset token in Redis (if available), otherwise skip (dev mode)
    from app.database.redis import is_redis_available, get_redis
    if is_redis_available():
        redis_client = get_redis()
        try:
            token_key = f"password_reset:{reset_token}"
            redis_client.setex(token_key, 3600, str(user.id))  # 1 hour
            print(f"[INFO] Password reset token stored for user {user.id} (email: {user.email})")
            print(f"[DEBUG] Token key: {token_key}, TTL: 3600 seconds (1 hour)")
        except Exception as e:
            print(f"[WARNING] Failed to store password reset token in Redis: {e}")
            # In dev mode without Redis, we'll just print the token
            print(f"[DEV] Password reset token for {user.email}: {reset_token}")
    else:
        print(f"[WARNING] Redis not available - password reset token not stored!")
        print(f"[DEV] Password reset token for {user.email}: {reset_token}")
    
    await send_password_reset_email(user.email, reset_token)
    return {"message": "If email exists, reset link has been sent"}


@router.post("/password-reset/confirm")
async def confirm_password_reset(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """Confirm password reset"""
    from app.database.redis import is_redis_available, get_redis
    
    user_id = None
    token_key = f"password_reset:{reset_data.token}"
    
    if is_redis_available():
        redis_client = get_redis()
        try:
            # Try to get the token
            user_id = redis_client.get(token_key)
            
            # If token doesn't exist, check if it might have expired
            if not user_id:
                # Check TTL to see if token exists but expired
                ttl = redis_client.ttl(token_key)
                if ttl == -2:  # Key doesn't exist
                    print(f"[DEBUG] Password reset token not found: {reset_data.token[:10]}...")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid or expired reset token. Please request a new password reset link."
                    )
                elif ttl == -1:  # Key exists but has no expiration (shouldn't happen)
                    print(f"[WARNING] Password reset token has no expiration: {reset_data.token[:10]}...")
                else:
                    # Token expired (TTL is 0 or negative)
                    print(f"[DEBUG] Password reset token expired (TTL: {ttl}): {reset_data.token[:10]}...")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Reset token has expired. Please request a new password reset link."
                    )
        except HTTPException:
            raise
        except Exception as e:
            print(f"[WARNING] Redis error during password reset: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error validating reset token. Please try again."
            )
    else:
        # Redis not available - this shouldn't happen in production
        # But for dev mode, we could add a fallback here if needed
        print(f"[WARNING] Redis not available for password reset confirmation")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Password reset service temporarily unavailable. Please try again later."
        )
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token. Please request a new password reset link."
        )
    
    try:
        user = db.query(User).filter(User.id == int(user_id)).first()
    except (ValueError, TypeError) as e:
        print(f"[ERROR] Invalid user_id from Redis: {user_id}, Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token format."
        )
    
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
    
    # Delete reset token from Redis (if available) - one-time use
    if is_redis_available():
        redis_client = get_redis()
        try:
            redis_client.delete(token_key)
            print(f"[INFO] Password reset token deleted after successful use")
        except Exception as e:
            print(f"[WARNING] Failed to delete reset token from Redis: {e}")
    
    return {"message": "Password reset successfully"}


@router.post("/verify-email")
async def verify_email(
    verification_data: EmailVerification,
    db: Session = Depends(get_db)
):
    """Verify user email address"""
    from app.database.redis import is_redis_available
    
    user_id = None
    if is_redis_available():
        redis_client = get_redis()
        try:
            user_id = redis_client.get(f"email_verify:{verification_data.token}")
        except Exception as e:
            print(f"[WARNING] Redis error during email verification: {e}")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
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
    
    # Delete verification token from Redis
    if is_redis_available():
        redis_client = get_redis()
        try:
            redis_client.delete(f"email_verify:{verification_data.token}")
        except Exception as e:
            print(f"[WARNING] Failed to delete verification token from Redis: {e}")
    
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
    
    # Store verification token in Redis (24 hours expiry)
    from app.database.redis import is_redis_available
    if is_redis_available():
        redis_client = get_redis()
        try:
            redis_client.setex(f"email_verify:{verification_token}", 86400, str(user.id))  # 24 hours
        except Exception as e:
            print(f"[WARNING] Failed to store email verification token in Redis: {e}")
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

