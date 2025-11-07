from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.schemas.post_schema import PostResponse
from app.services.feed_service import get_personalized_feed
from app.utils.dependencies import get_current_user
from app.models.user import User
from typing import List, Dict

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("/personalized")
async def get_personalized_feed_route(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized feed for current user"""
    from app.services.post_service import get_post_content
    from app.schemas.post_schema import PostWithContent
    
    feed_data = get_personalized_feed(db, current_user.id)
    
    # Convert posts to PostResponse format
    result = {
        "latest_posts": [],
        "most_appreciated": [],
        "genre_posts": [],
        "current_reading": []
    }
    
    # Latest posts
    for post in feed_data.get("latest_posts", []):
        content = await get_post_content(post.mongo_id)
        if content:
            # Add author username
            from app.models.user import User
            author = db.query(User).filter(User.id == post.author_id).first()
            post_dict = post.__dict__.copy()
            post_dict['author_username'] = author.username if author else None
            post_dict['cover_image_url'] = content.cover_image_url
            result["latest_posts"].append(PostWithContent(
                **post_dict,
                content=content
            ))
    
    # Most appreciated posts
    for post in feed_data.get("most_appreciated", []):
        content = await get_post_content(post.mongo_id)
        if content:
            # Add author username
            from app.models.user import User
            author = db.query(User).filter(User.id == post.author_id).first()
            post_dict = post.__dict__.copy()
            post_dict['author_username'] = author.username if author else None
            post_dict['cover_image_url'] = content.cover_image_url
            result["most_appreciated"].append(PostWithContent(
                **post_dict,
                content=content
            ))
    
    # Genre posts
    for post in feed_data.get("genre_posts", []):
        content = await get_post_content(post.mongo_id)
        if content:
            # Add author username
            from app.models.user import User
            author = db.query(User).filter(User.id == post.author_id).first()
            post_dict = post.__dict__.copy()
            post_dict['author_username'] = author.username if author else None
            post_dict['cover_image_url'] = content.cover_image_url
            result["genre_posts"].append(PostWithContent(
                **post_dict,
                content=content
            ))
    
    # Current reading
    for item in feed_data.get("current_reading", []):
        post = item["post"]
        progress = item["progress"]
        content = await get_post_content(post.mongo_id)
        if content:
            # Add author username
            from app.models.user import User
            author = db.query(User).filter(User.id == post.author_id).first()
            post_dict = post.__dict__.copy()
            post_dict['author_username'] = author.username if author else None
            post_dict['cover_image_url'] = content.cover_image_url
            result["current_reading"].append({
                "post": PostWithContent(
                    **post_dict,
                    content=content
                ),
                "progress": {
                    "current_page": progress.current_page,
                    "total_pages": progress.total_pages,
                    "progress_percentage": progress.progress_percentage,
                    "last_read_at": progress.last_read_at.isoformat() if progress.last_read_at else None
                }
            })
    
    return result

