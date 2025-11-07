from sqlalchemy.orm import Session
from app.models.post import Post
from app.models.user import User
from app.schemas.post_schema import PostCreate, PostContent
from app.database.mongo import get_mongo_db
from bson import ObjectId
from typing import List, Optional
from datetime import datetime, timezone


async def create_post(db: Session, post_data: PostCreate, author_id: int) -> Post:
    """Create a new post"""
    # Store content in MongoDB
    mongo_db = get_mongo_db()
    content_doc = {
        "body": post_data.content.body,
        "tags": post_data.content.tags,
        "cover_image_url": post_data.content.cover_image_url if hasattr(post_data.content, 'cover_image_url') else None,
        "description": post_data.content.description if hasattr(post_data.content, 'description') else None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    # Use await for async MongoDB operations
    mongo_result = await mongo_db.posts.insert_one(content_doc)
    mongo_id = str(mongo_result.inserted_id)
    
    # Store metadata in PostgreSQL
    db_post = Post(
        title=post_data.title,
        slug=post_data.slug,
        mongo_id=mongo_id,
        author_id=author_id,
        visibility=post_data.visibility,
        content_type=post_data.content_type
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post


def get_post(db: Session, post_id: int) -> Optional[Post]:
    """Get post by ID"""
    return db.query(Post).filter(Post.id == post_id).first()


def get_post_by_slug(db: Session, slug: str) -> Optional[Post]:
    """Get post by slug"""
    return db.query(Post).filter(Post.slug == slug).first()


async def get_post_content(mongo_id: str) -> Optional[PostContent]:
    """Get post content from MongoDB"""
    mongo_db = get_mongo_db()
    doc = await mongo_db.posts.find_one({"_id": ObjectId(mongo_id)})
    if not doc:
        return None
    return PostContent(
        body=doc.get("body", ""),
        tags=doc.get("tags", []),
        cover_image_url=doc.get("cover_image_url"),
        description=doc.get("description")
    )


async def update_post(db: Session, post: Post, post_data: dict) -> Post:
    """Update post"""
    # Update MongoDB content if provided
    if "content" in post_data:
        mongo_db = get_mongo_db()
        update_fields = {
            "body": post_data["content"].body,
            "tags": post_data["content"].tags,
            "updated_at": datetime.now(timezone.utc)
        }
        if hasattr(post_data["content"], 'cover_image_url') and post_data["content"].cover_image_url is not None:
            update_fields["cover_image_url"] = post_data["content"].cover_image_url
        if hasattr(post_data["content"], 'description') and post_data["content"].description is not None:
            update_fields["description"] = post_data["content"].description
        
        await mongo_db.posts.update_one(
            {"_id": ObjectId(post.mongo_id)},
            {"$set": update_fields}
        )
    
    # Update PostgreSQL metadata
    if "title" in post_data:
        post.title = post_data["title"]
    if "slug" in post_data:
        post.slug = post_data["slug"]
    if "visibility" in post_data:
        post.visibility = post_data["visibility"]
    if "content_type" in post_data:
        post.content_type = post_data["content_type"]
    
    db.commit()
    db.refresh(post)
    return post


async def delete_post(db: Session, post: Post):
    """Delete post"""
    # Delete from MongoDB
    mongo_db = get_mongo_db()
    await mongo_db.posts.delete_one({"_id": ObjectId(post.mongo_id)})
    
    # Delete from PostgreSQL
    db.delete(post)
    db.commit()


def get_public_posts(db: Session, skip: int = 0, limit: int = 20, sort_by: str = "latest", search: Optional[str] = None, content_type: Optional[str] = None) -> tuple[List[Post], int]:
    """Get public posts with pagination, search, and filtering"""
    from sqlalchemy import desc, or_, func
    
    query = db.query(Post).filter(Post.visibility == "public")
    
    # Search functionality - search in title
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(func.lower(Post.title).like(search_term))
    
    # Filter by content type
    if content_type:
        query = query.filter(Post.content_type == content_type)
    
    if sort_by == "latest":
        query = query.order_by(Post.created_at.desc())
    elif sort_by == "most_appreciated":
        # Sort by total engagement (likes + claps), then by created_at
        query = query.order_by(
            desc(Post.likes_count + Post.claps_count),
            desc(Post.created_at)
        )
    
    total = query.count()
    posts = query.offset(skip).limit(limit).all()
    return posts, total


def get_user_posts(db: Session, user_id: int, include_drafts: bool = False) -> List[Post]:
    """Get posts by user"""
    query = db.query(Post).filter(Post.author_id == user_id)
    if not include_drafts:
        query = query.filter(Post.visibility == "public")
    return query.order_by(Post.created_at.desc()).all()