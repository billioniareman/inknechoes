from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.schemas.user_schema import UserCreate, UserLogin, UserResponse, Token, PasswordReset, PasswordResetConfirm
from app.services.auth_service import create_user, authenticate_user, get_user_by_email, update_user_password
from app.utils.jwt_handler import create_access_token, create_refresh_token, verify_token
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.utils.email_utils import send_password_reset_email, send_welcome_email
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
    await send_welcome_email(user.email, user.username)
    return user


@router.post("/login", response_model=Token)
async def login(
    user_data: UserLogin,
    response: Response,
    db: Session = Depends(get_db)
):
    """Login user and return JWT tokens"""
    user = authenticate_user(db, user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create tokens (sub must be a string for JWT)
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Store refresh token in Redis (if available)
    # Note: If Redis is not available, tokens will still work via cookies
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
            # Continue - tokens will work via cookies even without Redis
    
    # Set HTTP-only cookies with explicit path
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.ENV == "production",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
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
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout user"""
    # Remove refresh token from Redis (if available)
    from app.database.redis import is_redis_available
    if is_redis_available():
        redis_client = get_redis()
        try:
            redis_client.delete(f"refresh_token:{current_user.id}")
        except Exception as e:
            print(f"[WARNING] Failed to delete refresh token from Redis: {e}")
    
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
    from app.database.redis import is_redis_available
    if is_redis_available():
        redis_client = get_redis()
        try:
            redis_client.setex(f"password_reset:{reset_token}", 3600, str(user.id))  # 1 hour
        except Exception as e:
            print(f"[WARNING] Failed to store password reset token in Redis: {e}")
            # In dev mode without Redis, we'll just print the token
            print(f"[DEV] Password reset token for {user.email}: {reset_token}")
    
    await send_password_reset_email(user.email, reset_token)
    return {"message": "If email exists, reset link has been sent"}


@router.post("/password-reset/confirm")
async def confirm_password_reset(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """Confirm password reset"""
    from app.database.redis import is_redis_available
    
    user_id = None
    if is_redis_available():
        redis_client = get_redis()
        try:
            user_id = redis_client.get(f"password_reset:{reset_data.token}")
        except Exception as e:
            print(f"[WARNING] Redis error during password reset: {e}")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    update_user_password(db, user, reset_data.new_password)
    
    # Delete reset token from Redis (if available)
    if is_redis_available():
        redis_client = get_redis()
        try:
            redis_client.delete(f"password_reset:{reset_data.token}")
        except Exception as e:
            print(f"[WARNING] Failed to delete reset token from Redis: {e}")
    
    return {"message": "Password reset successfully"}

