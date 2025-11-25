from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.tag import Tag, post_tags
from app.models.post import Post
from app.schemas.tag_schema import TagCreate, TagUpdate, TagResponse
from typing import List, Optional
import re


def create_slug(name: str) -> str:
    """Create a URL-friendly slug from tag name"""
    slug = name.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)  # Remove special chars
    slug = re.sub(r'[-\s]+', '-', slug)   # Replace spaces/hyphens with single hyphen
    return slug


def create_tag(db: Session, tag_data: TagCreate) -> Tag:
    """Create a new tag"""
    name = tag_data.name.lower().strip()
    
    # Check if tag already exists
    existing_tag = db.query(Tag).filter(Tag.name == name).first()
    if existing_tag:
        return existing_tag
    
    slug = create_slug(name)
    
    # Ensure slug is unique
    base_slug = slug
    counter = 1
    while db.query(Tag).filter(Tag.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    tag = Tag(
        name=name,
        slug=slug,
        description=tag_data.description
    )
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def get_tag(db: Session, tag_id: int) -> Optional[Tag]:
    """Get tag by ID"""
    return db.query(Tag).filter(Tag.id == tag_id).first()


def get_tag_by_name(db: Session, name: str) -> Optional[Tag]:
    """Get tag by name"""
    return db.query(Tag).filter(Tag.name == name.lower().strip()).first()


def get_tag_by_slug(db: Session, slug: str) -> Optional[Tag]:
    """Get tag by slug"""
    return db.query(Tag).filter(Tag.slug == slug).first()


def get_all_tags(db: Session, skip: int = 0, limit: int = 100) -> List[Tag]:
    """Get all tags with pagination"""
    return db.query(Tag).order_by(Tag.name).offset(skip).limit(limit).all()


def get_popular_tags(db: Session, limit: int = 20) -> List[Tag]:
    """Get most popular tags by usage count"""
    return db.query(Tag).order_by(desc(Tag.usage_count)).limit(limit).all()


def get_trending_tags(db: Session, limit: int = 10) -> List[dict]:
    """
    Get trending tags based on recent post count
    Returns tags with their current post count
    """
    # Count posts per tag (only public posts)
    tag_stats = db.query(
        Tag.id,
        Tag.name,
        Tag.slug,
        Tag.description,
        Tag.usage_count,
        func.count(Post.id).label('post_count')
    ).join(
        post_tags, Tag.id == post_tags.c.tag_id
    ).join(
        Post, Post.id == post_tags.c.post_id
    ).filter(
        Post.visibility == 'public'
    ).group_by(
        Tag.id
    ).order_by(
        desc('post_count')
    ).limit(limit).all()
    
    return [
        {
            'id': stat.id,
            'name': stat.name,
            'slug': stat.slug,
            'description': stat.description,
            'usage_count': stat.usage_count,
            'post_count': stat.post_count
        }
        for stat in tag_stats
    ]


def search_tags(db: Session, query: str, limit: int = 20) -> List[Tag]:
    """Search tags by name"""
    search_term = f"%{query.lower()}%"
    return db.query(Tag).filter(
        Tag.name.like(search_term)
    ).order_by(Tag.usage_count.desc()).limit(limit).all()


def update_tag(db: Session, tag: Tag, tag_data: TagUpdate) -> Tag:
    """Update tag"""
    if tag_data.name:
        tag.name = tag_data.name.lower().strip()
        tag.slug = create_slug(tag.name)
    if tag_data.description is not None:
        tag.description = tag_data.description
    
    db.commit()
    db.refresh(tag)
    return tag


def delete_tag(db: Session, tag: Tag) -> bool:
    """Delete tag"""
    db.delete(tag)
    db.commit()
    return True


def add_tags_to_post(db: Session, post_id: int, tag_names: List[str]) -> List[Tag]:
    """
    Add tags to a post. Creates tags if they don't exist.
    Updates usage_count for each tag.
    """
    tags = []
    for tag_name in tag_names:
        tag_name = tag_name.lower().strip()
        if not tag_name:
            continue
        
        # Get or create tag
        tag = get_tag_by_name(db, tag_name)
        if not tag:
            tag = create_tag(db, TagCreate(name=tag_name))
        
        tags.append(tag)
    
    # Get the post
    post = db.query(Post).filter(Post.id == post_id).first()
    if post:
        # Clear existing tags
        post.tags.clear()
        
        # Add new tags
        for tag in tags:
            post.tags.append(tag)
            # Update usage count
            tag.usage_count = db.query(post_tags).filter(
                post_tags.c.tag_id == tag.id
            ).count()
        
        db.commit()
    
    return tags


def get_posts_by_tag(db: Session, tag_slug: str, skip: int = 0, limit: int = 20) -> tuple:
    """Get posts that have a specific tag"""
    tag = get_tag_by_slug(db, tag_slug)
    if not tag:
        return [], 0
    
    # Query posts with this tag (only public)
    posts_query = db.query(Post).join(
        post_tags, Post.id == post_tags.c.post_id
    ).filter(
        post_tags.c.tag_id == tag.id,
        Post.visibility == 'public'
    ).order_by(desc(Post.created_at))
    
    total = posts_query.count()
    posts = posts_query.offset(skip).limit(limit).all()
    
    return posts, total
