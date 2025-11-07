"""
Seed script to populate database with sample data
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database.postgres import SessionLocal, engine, Base
from app.models.user import User
from app.models.post import Post
from app.services.auth_service import get_password_hash
from app.database.mongo import connect_to_mongo, get_mongo_db
from datetime import datetime, timezone
from bson import ObjectId

# Create tables
Base.metadata.create_all(bind=engine)

db: Session = SessionLocal()


def seed_users():
    """Create sample users"""
    print("Creating sample users...")
    
    # Check if admin already exists
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            email="admin@inknechoes.com",
            username="admin",
            hashed_password=get_password_hash("admin123"),
            bio="Administrator of Ink&Echoes",
            is_admin=True,
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"Created admin user: {admin.username}")
    else:
        print(f"Admin user already exists: {admin.username}")
    
    # Create regular users
    users_data = [
        {
            "email": "writer1@inknechoes.com",
            "username": "jane_doe",
            "bio": "Fiction writer and poet",
            "genre_tags": "fiction,poetry,literary"
        },
        {
            "email": "writer2@inknechoes.com",
            "username": "john_smith",
            "bio": "Sci-fi enthusiast",
            "genre_tags": "sci-fi,fantasy"
        },
    ]
    
    created_users = [admin] if admin else []
    
    for user_data in users_data:
        existing_user = db.query(User).filter(User.username == user_data["username"]).first()
        if not existing_user:
            user = User(
                email=user_data["email"],
                username=user_data["username"],
                hashed_password=get_password_hash("password123"),
                bio=user_data["bio"],
                genre_tags=user_data["genre_tags"],
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created user: {user.username}")
            created_users.append(user)
        else:
            print(f"User already exists: {existing_user.username}")
            created_users.append(existing_user)
    
    return created_users


def seed_posts(users):
    """Create sample posts"""
    print("Creating sample posts...")
    
    import asyncio
    
    async def create_posts():
        await connect_to_mongo()
        mongo_db = get_mongo_db()
        
        posts_data = [
            {
                "title": "Welcome to Ink&Echoes",
                "slug": "welcome-to-ink-echoes",
                "body": "<h1>Welcome!</h1><p>This is a sample post to demonstrate the platform.</p>",
                "tags": ["announcement", "welcome"],
                "author_username": "admin",
                "visibility": "public"
            },
            {
                "title": "The Art of Storytelling",
                "slug": "the-art-of-storytelling",
                "body": "<h2>The Art of Storytelling</h2><p>Storytelling is an ancient art form that has been passed down through generations...</p>",
                "tags": ["writing", "storytelling"],
                "author_username": "jane_doe",
                "visibility": "public"
            },
            {
                "title": "Exploring the Cosmos",
                "slug": "exploring-the-cosmos",
                "body": "<h2>Exploring the Cosmos</h2><p>The universe is vast and mysterious, full of wonders waiting to be discovered...</p>",
                "tags": ["sci-fi", "space"],
                "author_username": "john_smith",
                "visibility": "public"
            },
        ]
        
        for post_data in posts_data:
            # Check if post already exists
            existing_post = db.query(Post).filter(Post.slug == post_data["slug"]).first()
            if existing_post:
                print(f"Post already exists: {post_data['title']}")
                continue
            
            author = next((u for u in users if u.username == post_data["author_username"]), None)
            if not author:
                print(f"Author not found: {post_data['author_username']}")
                continue
            
            # Create MongoDB document
            from datetime import timezone
            content_doc = {
                "body": post_data["body"],
                "tags": post_data["tags"],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            mongo_result = await mongo_db.posts.insert_one(content_doc)
            mongo_id = str(mongo_result.inserted_id)
            
            # Create PostgreSQL metadata
            post = Post(
                title=post_data["title"],
                slug=post_data["slug"],
                mongo_id=mongo_id,
                author_id=author.id,
                visibility=post_data["visibility"]
            )
            db.add(post)
            db.commit()
            db.refresh(post)
            print(f"Created post: {post.title}")
    
    asyncio.run(create_posts())


if __name__ == "__main__":
    print("Starting database seed...")
    users = seed_users()
    seed_posts(users)
    print("Seed completed!")
    db.close()

