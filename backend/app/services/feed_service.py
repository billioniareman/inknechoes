"""
Service for generating personalized feed content
"""
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from app.models.user import User
from app.models.post import Post
from app.models.reading_progress import ReadingProgress
from app.models.comment import Comment
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import asyncio


def get_personalized_feed(db: Session, user_id: int) -> Dict:
    """Get personalized feed for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {}
    
    # Get user's genre preferences
    user_genres = []
    if user.genre_tags:
        user_genres = [tag.strip().lower() for tag in user.genre_tags.split(',')]
    
    # Get latest posts
    latest_posts = db.query(Post).filter(
        Post.visibility == "public"
    ).order_by(Post.created_at.desc()).limit(10).all()
    
    # Get most appreciated posts
    most_appreciated = db.query(Post).filter(
        Post.visibility == "public"
    ).order_by(
        desc(Post.likes_count + Post.claps_count),
        desc(Post.created_at)
    ).limit(10).all()
    
    # Get posts matching user's genre preferences
    genre_posts = []
    if user_genres:
        # Get posts with tags matching user's genres
        # Since tags are in MongoDB, we'll get all posts and filter by content_type
        # For now, we'll match by content_type (article, poetry, book)
        # In a more advanced version, we'd query MongoDB for tags
        all_posts = db.query(Post).filter(
            Post.visibility == "public"
        ).order_by(Post.created_at.desc()).limit(100).all()
        
        # Get MongoDB connection to check tags
        from app.database.mongo import get_mongo_db
        from bson import ObjectId
        mongo_db = get_mongo_db()
        
        # Filter posts by matching tags or content_type
        for post in all_posts:
            try:
                # Check MongoDB for tags (synchronous for now)
                # In production, you might want to batch this
                doc = mongo_db.posts.find_one({"_id": ObjectId(post.mongo_id)})
                if doc:
                    post_tags = [tag.lower().strip() for tag in doc.get("tags", [])]
                    # Check if any post tag matches user's genre preferences
                    if any(tag in user_genres for tag in post_tags):
                        genre_posts.append(post)
                    # Also check content_type
                    elif post.content_type and post.content_type.lower() in user_genres:
                        genre_posts.append(post)
                    elif not post.content_type and "article" in user_genres:
                        genre_posts.append(post)
            except Exception as e:
                # Fallback to content_type matching
                if post.content_type and post.content_type.lower() in user_genres:
                    genre_posts.append(post)
                elif not post.content_type and "article" in user_genres:
                    genre_posts.append(post)
        
        # Limit to 10
        genre_posts = genre_posts[:10]
    
    # Get current/last reading books
    reading_progress = db.query(ReadingProgress).filter(
        ReadingProgress.user_id == user_id
    ).order_by(ReadingProgress.last_read_at.desc()).limit(5).all()
    
    current_reading = []
    for progress in reading_progress:
        post = db.query(Post).filter(Post.id == progress.post_id).first()
        if post and post.content_type == "book" and post.visibility == "public":
            current_reading.append({
                "post": post,
                "progress": progress
            })
    
    return {
        "latest_posts": latest_posts,
        "most_appreciated": most_appreciated,
        "genre_posts": genre_posts,
        "current_reading": current_reading
    }


def get_posts_by_genre(db: Session, genres: List[str], limit: int = 10) -> List[Post]:
    """Get posts matching specific genres"""
    if not genres:
        return []
    
    # Match by content_type for now
    # In production, you'd query MongoDB for tags
    posts = db.query(Post).filter(
        Post.visibility == "public",
        or_(*[Post.content_type == genre for genre in genres])
    ).order_by(Post.created_at.desc()).limit(limit).all()
    
    return posts

