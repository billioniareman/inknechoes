"""
Service for managing book chapters
"""
from sqlalchemy.orm import Session
from app.models.chapter import Chapter
from app.models.post import Post
from app.schemas.chapter_schema import ChapterCreate, ChapterContent
from app.database.mongo import get_mongo_db
from bson import ObjectId
from typing import List, Optional
from datetime import datetime, timezone


async def create_chapter(db: Session, chapter_data: ChapterCreate, post_id: int) -> Chapter:
    """Create a new chapter"""
    # Store chapter content in MongoDB
    mongo_db = get_mongo_db()
    content_doc = {
        "body": chapter_data.content.body,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    mongo_result = await mongo_db.chapters.insert_one(content_doc)
    mongo_id = str(mongo_result.inserted_id)
    
    # Store metadata in PostgreSQL
    db_chapter = Chapter(
        title=chapter_data.title,
        order=chapter_data.order,
        mongo_id=mongo_id,
        post_id=post_id
    )
    db.add(db_chapter)
    db.commit()
    db.refresh(db_chapter)
    return db_chapter


def get_chapter(db: Session, chapter_id: int) -> Optional[Chapter]:
    """Get chapter by ID"""
    return db.query(Chapter).filter(Chapter.id == chapter_id).first()


def get_chapters_by_post(db: Session, post_id: int) -> List[Chapter]:
    """Get all chapters for a post, ordered by order field"""
    return db.query(Chapter).filter(Chapter.post_id == post_id).order_by(Chapter.order).all()


async def get_chapter_content(mongo_id: str) -> Optional[ChapterContent]:
    """Get chapter content from MongoDB"""
    mongo_db = get_mongo_db()
    doc = await mongo_db.chapters.find_one({"_id": ObjectId(mongo_id)})
    if not doc:
        return None
    return ChapterContent(body=doc.get("body", ""))


async def update_chapter(db: Session, chapter: Chapter, chapter_data: dict) -> Chapter:
    """Update chapter"""
    # Update MongoDB content if provided
    if "content" in chapter_data:
        mongo_db = get_mongo_db()
        await mongo_db.chapters.update_one(
            {"_id": ObjectId(chapter.mongo_id)},
            {"$set": {
                "body": chapter_data["content"].body,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
    
    # Update PostgreSQL metadata
    if "title" in chapter_data:
        chapter.title = chapter_data["title"]
    if "order" in chapter_data:
        chapter.order = chapter_data["order"]
    
    db.commit()
    db.refresh(chapter)
    return chapter


async def delete_chapter(db: Session, chapter: Chapter):
    """Delete chapter"""
    # Delete from MongoDB
    mongo_db = get_mongo_db()
    await mongo_db.chapters.delete_one({"_id": ObjectId(chapter.mongo_id)})
    
    # Delete from PostgreSQL
    db.delete(chapter)
    db.commit()

