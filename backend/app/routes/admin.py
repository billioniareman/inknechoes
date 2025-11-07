from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.schemas.user_schema import UserResponse
from app.schemas.post_schema import PostResponse
from app.schemas.comment_schema import CommentResponse
from app.models.user import User
from app.models.post import Post
from app.models.comment import Comment
from app.utils.dependencies import get_current_admin
from app.services.post_service import delete_post

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserResponse])
async def get_all_users(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    users = db.query(User).all()
    return users


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete user (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete admin user"
        )
    
    db.delete(user)
    db.commit()
    return None


@router.get("/posts", response_model=list[PostResponse])
async def get_all_posts(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all posts (admin only)"""
    posts = db.query(Post).order_by(Post.created_at.desc()).all()
    return posts


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_post(
    post_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete any post (admin only)"""
    from app.services.post_service import get_post
    post = get_post(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    await delete_post(db, post)
    return None


@router.get("/comments", response_model=list[CommentResponse])
async def get_all_comments(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all comments (admin only)"""
    comments = db.query(Comment).order_by(Comment.created_at.desc()).all()
    for comment in comments:
        comment.author_username = db.query(User).filter(User.id == comment.author_id).first().username
    return comments


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_comment(
    comment_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete any comment (admin only)"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    db.delete(comment)
    db.commit()
    return None


@router.get("/stats")
async def get_admin_stats(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get admin statistics with analytics"""
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    total_users = db.query(User).count()
    total_posts = db.query(Post).count()
    total_comments = db.query(Comment).count()
    public_posts = db.query(Post).filter(Post.visibility == "public").count()
    
    # Engagement metrics
    total_likes = db.query(func.sum(Post.likes_count)).scalar() or 0
    total_claps = db.query(func.sum(Post.claps_count)).scalar() or 0
    
    # Recent activity (last 7 days)
    seven_days_ago = datetime.now() - timedelta(days=7)
    recent_users = db.query(User).filter(User.created_at >= seven_days_ago).count()
    recent_posts = db.query(Post).filter(Post.created_at >= seven_days_ago).count()
    recent_comments = db.query(Comment).filter(Comment.created_at >= seven_days_ago).count()
    
    # Content type breakdown
    poetry_count = db.query(Post).filter(Post.content_type == "poetry").count()
    book_count = db.query(Post).filter(Post.content_type == "book").count()
    article_count = db.query(Post).filter(Post.content_type == "article").count()
    
    # Top authors (by post count)
    from sqlalchemy import desc
    top_authors = db.query(
        User.username,
        func.count(Post.id).label('post_count')
    ).join(Post).group_by(User.id, User.username).order_by(desc('post_count')).limit(5).all()
    
    return {
        "total_users": total_users,
        "total_posts": total_posts,
        "public_posts": public_posts,
        "draft_posts": total_posts - public_posts,
        "total_comments": total_comments,
        "total_likes": int(total_likes),
        "total_claps": int(total_claps),
        "recent_activity": {
            "users_last_7_days": recent_users,
            "posts_last_7_days": recent_posts,
            "comments_last_7_days": recent_comments
        },
        "content_breakdown": {
            "poetry": poetry_count,
            "book": book_count,
            "article": article_count
        },
        "top_authors": [
            {"username": username, "post_count": count}
            for username, count in top_authors
        ]
    }

