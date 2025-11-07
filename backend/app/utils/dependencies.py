from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.models.user import User
from app.utils.jwt_handler import verify_token

async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    # Try to get access token from cookies
    access_token = request.cookies.get("access_token")
    
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # URL decode the token if needed (cookies might be URL-encoded)
    import urllib.parse
    try:
        # Try to decode in case it's URL-encoded
        access_token = urllib.parse.unquote(access_token)
    except:
        pass  # If decoding fails, use original token
    
    # Verify token
    payload = verify_token(access_token, token_type="access")
    if payload is None:
        # Log for debugging
        from loguru import logger
        logger.warning(f"Token verification failed - token length: {len(access_token)}, first 20 chars: {access_token[:20]}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    # Convert string user_id back to int
    try:
        user_id: int = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current admin user"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

