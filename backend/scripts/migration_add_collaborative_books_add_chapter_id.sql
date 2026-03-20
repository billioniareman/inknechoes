-- Migration: add 'chapter_id' column to collaborative_books if missing

-- Adds the column (if not present) and recreates the unique index on (book_id, chapter_id).
-- Run this against your development database (psql) or via docker-compose:
-- docker-compose exec postgres psql -U dev -d inknechoes -f /path/to/backend/scripts/migration_add_collaborative_books_add_chapter_id.sql

ALTER TABLE collaborative_books
  ADD COLUMN IF NOT EXISTS chapter_id integer NULL;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_collab_books_book_id ON collaborative_books (book_id);
CREATE INDEX IF NOT EXISTS idx_collab_books_owner_id ON collaborative_books (owner_id);

-- Unique index for (book_id, chapter_id) -- allows NULLs but ensures uniqueness for non-NULL combos
CREATE UNIQUE INDEX IF NOT EXISTS idx_collab_books_book_chapter ON collaborative_books (book_id, chapter_id);

-- If you rely on explicit constraints or need to backfill values for existing rows, do that before adding the UNIQUE index.
-- Example backfill (only if you want to coalesce existing rows to a default chapter id):
-- UPDATE collaborative_books SET chapter_id = NULL WHERE chapter_id IS NULL;

-- End of migration
