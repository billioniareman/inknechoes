"""
Migration script to add security features to users table
Adds: email_verified, failed_login_attempts, locked_until columns
"""
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database.postgres import engine
from app.config import get_settings

settings = get_settings()

def migrate_user_security_features():
    """Add security feature columns to users table"""
    print("Starting migration: Adding security features to users table...")
    
    with engine.connect() as conn:
        try:
            # Check if columns already exist
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name IN ('email_verified', 'failed_login_attempts', 'locked_until')
            """))
            existing_columns = [row[0] for row in result]
            
            # Add email_verified column if it doesn't exist
            if 'email_verified' not in existing_columns:
                print("Adding email_verified column...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN email_verified BOOLEAN DEFAULT FALSE NOT NULL
                """))
                print("[OK] email_verified column added")
            else:
                print("[OK] email_verified column already exists")
            
            # Add failed_login_attempts column if it doesn't exist
            if 'failed_login_attempts' not in existing_columns:
                print("Adding failed_login_attempts column...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN failed_login_attempts INTEGER DEFAULT 0 NOT NULL
                """))
                print("[OK] failed_login_attempts column added")
            else:
                print("[OK] failed_login_attempts column already exists")
            
            # Add locked_until column if it doesn't exist
            if 'locked_until' not in existing_columns:
                print("Adding locked_until column...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN locked_until TIMESTAMP WITH TIME ZONE
                """))
                print("[OK] locked_until column added")
            else:
                print("[OK] locked_until column already exists")
            
            # Commit the transaction
            conn.commit()
            print("\n[SUCCESS] Migration completed successfully!")
            
        except Exception as e:
            conn.rollback()
            print(f"\n[ERROR] Migration failed: {e}")
            raise

if __name__ == "__main__":
    migrate_user_security_features()

