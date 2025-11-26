from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.models.user import User
from app.models.post import Post
from app.utils.dependencies import get_current_user, get_optional_current_user
from app.services import analytics_service
from typing import Optional

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.post("/track/{post_id}")
def track_view(
    post_id: int,
    request: Request,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Track a page view for a post.
    """
    # Verify post exists
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    view = analytics_service.track_page_view(
        db=db,
        post_id=post_id,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
        user_id=current_user.id if current_user else None,
        referer=request.headers.get("referer")
    )
    
    return {"id": view.id, "status": "recorded"}

@router.post("/time/{view_id}")
def track_time(
    view_id: int,
    seconds: float = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """
    Update time spent for a specific view.
    """
    analytics_service.update_time_spent(db, view_id, seconds)
    return {"status": "updated"}

@router.get("/post/{post_id}")
def get_post_stats(
    post_id: int,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get analytics for a specific post.
    Only available to the post author.
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    if post.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to view stats for this post")
        
    return analytics_service.get_post_analytics(db, post_id, days)

@router.get("/author/me")
def get_my_stats(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get aggregated analytics for the current user.
    """
    return analytics_service.get_author_analytics(db, current_user.id, days)
