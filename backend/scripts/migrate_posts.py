"""
Migration script to add new columns to posts table
Run this once to update your existing database schema
"""
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.database.postgres import engine, SessionLocal
from app.models.post import post_likes, post_claps

def migrate_posts_table():
    """Add new columns to posts table if they don't exist"""
    try:
        # Check if columns exist and add them if they don't
        with engine.begin() as conn:
            # Check and add likes_count column
            try:
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='posts' AND column_name='likes_count'
                """))
                if not result.fetchone():
                    conn.execute(text("ALTER TABLE posts ADD COLUMN likes_count INTEGER DEFAULT 0"))
                    print("✓ Added likes_count column")
                else:
                    print("✓ likes_count column already exists")
            except Exception as e:
                print(f"Note: likes_count column - {e}")

            # Check and add claps_count column
            try:
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='posts' AND column_name='claps_count'
                """))
                if not result.fetchone():
                    conn.execute(text("ALTER TABLE posts ADD COLUMN claps_count INTEGER DEFAULT 0"))
                    print("✓ Added claps_count column")
                else:
                    print("✓ claps_count column already exists")
            except Exception as e:
                print(f"Note: claps_count column - {e}")

            # Check and add content_type column
            try:
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='posts' AND column_name='content_type'
                """))
                if not result.fetchone():
                    conn.execute(text("ALTER TABLE posts ADD COLUMN content_type VARCHAR DEFAULT 'article'"))
                    print("✓ Added content_type column")
                else:
                    print("✓ content_type column already exists")
            except Exception as e:
                print(f"Note: content_type column - {e}")

            # Create association tables for likes and claps
            try:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS post_likes (
                        post_id INTEGER NOT NULL,
                        user_id INTEGER NOT NULL,
                        PRIMARY KEY (post_id, user_id),
                        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                    )
                """))
                print("✓ Created post_likes table")
            except Exception as e:
                print(f"Note: post_likes table - {e}")

            try:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS post_claps (
                        post_id INTEGER NOT NULL,
                        user_id INTEGER NOT NULL,
                        PRIMARY KEY (post_id, user_id),
                        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                    )
                """))
                print("✓ Created post_claps table")
            except Exception as e:
                print(f"Note: post_claps table - {e}")

        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Migration error: {e}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    print("Running posts table migration...")
    migrate_posts_table()

