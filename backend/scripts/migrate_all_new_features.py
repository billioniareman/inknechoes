"""
Comprehensive migration script for all new features
Creates: audit_logs, user_preferences, user_sessions tables
"""
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, inspect
from app.database.postgres import engine

def table_exists(conn, table_name):
    """Check if a table exists"""
    result = conn.execute(text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = :table_name
        )
    """), {"table_name": table_name})
    return result.scalar()

def migrate_all_new_features():
    """Create all new tables for security features"""
    print("Starting migration: Creating new tables for security features...")
    
    with engine.connect() as conn:
        try:
            # Create audit_logs table
            if not table_exists(conn, "audit_logs"):
                print("Creating audit_logs table...")
                conn.execute(text("""
                    CREATE TABLE audit_logs (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id),
                        action VARCHAR NOT NULL,
                        ip_address VARCHAR,
                        user_agent TEXT,
                        details TEXT,
                        status VARCHAR NOT NULL DEFAULT 'success',
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id)
                    )
                """))
                conn.execute(text("CREATE INDEX idx_audit_logs_action ON audit_logs(action)"))
                conn.execute(text("CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at)"))
                print("[OK] audit_logs table created")
            else:
                print("[OK] audit_logs table already exists")
            
            # Create user_preferences table
            if not table_exists(conn, "user_preferences"):
                print("Creating user_preferences table...")
                conn.execute(text("""
                    CREATE TABLE user_preferences (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
                        email_notifications_enabled BOOLEAN DEFAULT TRUE NOT NULL,
                        email_on_new_comment BOOLEAN DEFAULT TRUE NOT NULL,
                        email_on_new_follower BOOLEAN DEFAULT TRUE NOT NULL,
                        email_on_post_published BOOLEAN DEFAULT TRUE NOT NULL,
                        email_on_login BOOLEAN DEFAULT FALSE NOT NULL,
                        profile_visibility VARCHAR DEFAULT 'public' NOT NULL,
                        show_email BOOLEAN DEFAULT FALSE NOT NULL,
                        show_analytics BOOLEAN DEFAULT TRUE NOT NULL,
                        default_content_type VARCHAR DEFAULT 'article' NOT NULL,
                        default_visibility VARCHAR DEFAULT 'public' NOT NULL,
                        ui_preferences JSONB,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP WITH TIME ZONE,
                        CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES users(id)
                    )
                """))
                conn.execute(text("CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id)"))
                print("[OK] user_preferences table created")
            else:
                print("[OK] user_preferences table already exists")
            
            # Create user_sessions table
            if not table_exists(conn, "user_sessions"):
                print("Creating user_sessions table...")
                conn.execute(text("""
                    CREATE TABLE user_sessions (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id),
                        token_hash VARCHAR NOT NULL,
                        ip_address VARCHAR,
                        user_agent TEXT,
                        device_info VARCHAR,
                        location VARCHAR,
                        is_active BOOLEAN DEFAULT TRUE NOT NULL,
                        last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                        CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
                    )
                """))
                conn.execute(text("CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id)"))
                conn.execute(text("CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash)"))
                conn.execute(text("CREATE INDEX idx_user_sessions_created_at ON user_sessions(created_at)"))
                conn.execute(text("CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at)"))
                print("[OK] user_sessions table created")
            else:
                print("[OK] user_sessions table already exists")
            
            # Commit the transaction
            conn.commit()
            print("\n[SUCCESS] All migrations completed successfully!")
            
        except Exception as e:
            conn.rollback()
            print(f"\n[ERROR] Migration failed: {e}")
            raise

if __name__ == "__main__":
    migrate_all_new_features()

