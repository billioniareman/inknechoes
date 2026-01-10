-- Migration: add collaborative_books table

CREATE TABLE IF NOT EXISTS collaborative_books (
  id serial PRIMARY KEY,
  book_id integer NOT NULL,
  chapter_id integer NULL,
  title text NOT NULL,
  owner_id integer NOT NULL,
  snapshot bytea,
  collaborators jsonb DEFAULT '[]',
  permissions jsonb DEFAULT '{"edit": true}',
  is_active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collab_books_book_id ON collaborative_books (book_id);
CREATE INDEX IF NOT EXISTS idx_collab_books_owner_id ON collaborative_books (owner_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_collab_books_book_chapter ON collaborative_books (book_id, chapter_id);
