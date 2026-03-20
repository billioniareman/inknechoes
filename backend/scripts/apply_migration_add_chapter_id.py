"""Run the 'migration_add_collaborative_books_add_chapter_id.sql' against the configured DB.
Usage (from repo root):
  (venv) python backend/scripts/apply_migration_add_chapter_id.py

This uses the app's configured SQLAlchemy engine (settings.POSTGRES_URL) and runs the SQL in a single transaction.
"""
from pathlib import Path
import sys
from app.database.postgres import engine

SQL_FILE = Path(__file__).parent / "migration_add_collaborative_books_add_chapter_id.sql"

if not SQL_FILE.exists():
    print(f"Migration file not found: {SQL_FILE}")
    sys.exit(1)

sql_text = SQL_FILE.read_text()

print(f"Applying migration: {SQL_FILE}")
try:
    with engine.begin() as conn:
        conn.exec_driver_sql(sql_text)
    print("Migration applied successfully.")
except Exception as exc:
    print(f"Failed to apply migration: {exc}")
    sys.exit(2)
