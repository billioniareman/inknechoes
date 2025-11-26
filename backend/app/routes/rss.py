from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.models.post import Post
from app.models.user import User
from app.services.rss_service import generate_rss_feed
from typing import List

router = APIRouter(prefix="/rss", tags=["rss"])

@router.get("/global", response_class=Response)
def get_global_rss(db: Session = Depends(get_db)):
    """
    Get global RSS feed of latest public posts.
    """
    # Fetch latest 20 public posts
    posts = db.query(Post).filter(
        Post.visibility == 'public'
    ).order_by(Post.created_at.desc()).limit(20).all()

    # Get authors
    author_ids = {post.author_id for post in posts}
    authors = db.query(User).filter(User.id.in_(author_ids)).all()
    users_map = {user.id: user for user in authors}

    xml_content = generate_rss_feed(
        title="Ink&Echoes - Latest Stories",
        link="http://localhost:3000",
        description="Latest stories, poetry, and books from Ink&Echoes",
        posts=posts,
        users_map=users_map
    )

    return Response(content=xml_content, media_type="application/xml")

@router.get("/user/{username}", response_class=Response)
def get_user_rss(username: str, db: Session = Depends(get_db)):
    """
    Get RSS feed for a specific user.
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch user's latest 20 public posts
    posts = db.query(Post).filter(
        Post.author_id == user.id,
        Post.visibility == 'public'
    ).order_by(Post.created_at.desc()).limit(20).all()

    users_map = {user.id: user}

    xml_content = generate_rss_feed(
        title=f"Ink&Echoes - {user.username}'s Posts",
        link=f"http://localhost:3000/user/{user.username}",
        description=f"Latest posts by {user.username} on Ink&Echoes",
        posts=posts,
        users_map=users_map
    )

    return Response(content=xml_content, media_type="application/xml")
