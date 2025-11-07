"""
Migration script to add book features tables (chapters, bookmarks, reading_progress)
"""
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.database.postgres import engine, SessionLocal

def migrate_book_features():
    """Add tables for book features"""
    try:
        with engine.begin() as conn:
            # Create chapters table
            try:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS chapters (
                        id SERIAL PRIMARY KEY,
                        post_id INTEGER NOT NULL,
                        title VARCHAR NOT NULL,
                        "order" INTEGER NOT NULL,
                        mongo_id VARCHAR NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP WITH TIME ZONE,
                        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
                    )
                """))
                print("✓ Created chapters table")
            except Exception as e:
                print(f"Note: chapters table - {e}")

            # Create bookmarks table
            try:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS bookmarks (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        post_id INTEGER NOT NULL,
                        chapter_id INTEGER,
                        page_number INTEGER NOT NULL DEFAULT 1,
                        note VARCHAR,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP WITH TIME ZONE,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                        FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
                    )
                """))
                print("✓ Created bookmarks table")
            except Exception as e:
                print(f"Note: bookmarks table - {e}")

            # Create reading_progress table
            try:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS reading_progress (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        post_id INTEGER NOT NULL,
                        current_page INTEGER NOT NULL DEFAULT 1,
                        total_pages INTEGER NOT NULL DEFAULT 1,
                        progress_percentage REAL NOT NULL DEFAULT 0.0,
                        last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        reading_time_minutes INTEGER DEFAULT 0,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP WITH TIME ZONE,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                        UNIQUE(user_id, post_id)
                    )
                """))
                print("✓ Created reading_progress table")
            except Exception as e:
                print(f"Note: reading_progress table - {e}")

        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Migration error: {e}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    print("Running book features migration...")
    migrate_book_features()

