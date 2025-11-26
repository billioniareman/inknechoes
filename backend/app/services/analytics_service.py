from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from app.models.analytics import PageView
from app.models.post import Post
from app.models.comment import Comment
from typing import List, Dict, Any
import hashlib

def track_page_view(
    db: Session,
    post_id: int,
    ip_address: str,
    user_agent: str,
    user_id: int = None,
    referer: str = None
) -> PageView:
    """
    Track a page view.
    Hashes IP address for privacy.
    """
    # Hash IP for privacy
    ip_hash = hashlib.sha256(ip_address.encode()).hexdigest()
    
    # Check for duplicate view within short timeframe (e.g., 5 mins) to avoid spam
    # This is a simple debounce
    five_mins_ago = datetime.utcnow() - timedelta(minutes=5)
    existing_view = db.query(PageView).filter(
        PageView.post_id == post_id,
        PageView.ip_hash == ip_hash,
        PageView.created_at >= five_mins_ago
    ).first()
    
    if existing_view:
        return existing_view
        
    view = PageView(
        post_id=post_id,
        user_id=user_id,
        ip_hash=ip_hash,
        user_agent=user_agent,
        referer=referer
    )
    db.add(view)
    db.commit()
    db.refresh(view)
    return view

def update_time_spent(db: Session, view_id: int, seconds: float):
    """Update time spent for a page view"""
    view = db.query(PageView).filter(PageView.id == view_id).first()
    if view:
        view.time_spent = seconds
        db.commit()

def get_post_analytics(db: Session, post_id: int, days: int = 30) -> Dict[str, Any]:
    """Get analytics for a specific post"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Total views
    total_views = db.query(PageView).filter(
        PageView.post_id == post_id
    ).count()
    
    # Unique visitors (approximate by IP hash)
    unique_visitors = db.query(PageView.ip_hash).filter(
        PageView.post_id == post_id
    ).distinct().count()
    
    # Average time spent
    avg_time = db.query(func.avg(PageView.time_spent)).filter(
        PageView.post_id == post_id
    ).scalar() or 0
    
    # Views over time (daily)
    views_over_time = db.query(
        func.date(PageView.created_at).label('date'),
        func.count(PageView.id).label('count')
    ).filter(
        PageView.post_id == post_id,
        PageView.created_at >= start_date
    ).group_by(
        func.date(PageView.created_at)
    ).all()
    
    return {
        "total_views": total_views,
        "unique_visitors": unique_visitors,
        "avg_time_spent": round(avg_time, 2),
        "views_chart": [{"date": str(d), "count": c} for d, c in views_over_time]
    }

def get_author_analytics(db: Session, author_id: int, days: int = 30) -> Dict[str, Any]:
    """Get aggregated analytics for an author"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all author's posts
    author_posts = db.query(Post.id).filter(Post.author_id == author_id).all()
    post_ids = [p.id for p in author_posts]
    
    if not post_ids:
        return {
            "total_views": 0,
            "total_likes": 0,
            "total_comments": 0,
            "avg_time_spent": 0,
            "top_posts": [],
            "views_chart": []
        }
    
    # Total views
    total_views = db.query(PageView).filter(
        PageView.post_id.in_(post_ids)
    ).count()
    
    # Total likes
    total_likes = db.query(func.sum(Post.likes_count)).filter(
        Post.author_id == author_id
    ).scalar() or 0
    
    # Total comments
    total_comments = db.query(Comment).join(Post).filter(
        Post.author_id == author_id
    ).count()
    
    # Average time spent across all posts
    avg_time = db.query(func.avg(PageView.time_spent)).filter(
        PageView.post_id.in_(post_ids)
    ).scalar() or 0
    
    # Top performing posts
    top_posts = db.query(
        Post.title,
        Post.slug,
        func.count(PageView.id).label('view_count')
    ).join(PageView).filter(
        Post.author_id == author_id
    ).group_by(Post.id).order_by(desc('view_count')).limit(5).all()
    
    # Views over time (aggregated)
    views_over_time = db.query(
        func.date(PageView.created_at).label('date'),
        func.count(PageView.id).label('count')
    ).filter(
        PageView.post_id.in_(post_ids),
        PageView.created_at >= start_date
    ).group_by(
        func.date(PageView.created_at)
    ).all()
    
    return {
        "total_views": total_views,
        "total_likes": total_likes,
        "total_comments": total_comments,
        "avg_time_spent": round(avg_time, 2),
        "top_posts": [{"title": p.title, "slug": p.slug, "views": p.view_count} for p in top_posts],
        "views_chart": [{"date": str(d), "count": c} for d, c in views_over_time]
    }
