-- Migration SQL script to add new columns to posts table
-- Run this in your PostgreSQL database if the Python script doesn't work

-- Add likes_count column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='posts' AND column_name='likes_count'
    ) THEN
        ALTER TABLE posts ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add claps_count column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='posts' AND column_name='claps_count'
    ) THEN
        ALTER TABLE posts ADD COLUMN claps_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add content_type column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='posts' AND column_name='content_type'
    ) THEN
        ALTER TABLE posts ADD COLUMN content_type VARCHAR DEFAULT 'article';
    END IF;
END $$;

-- Create post_likes association table
CREATE TABLE IF NOT EXISTS post_likes (
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create post_claps association table
CREATE TABLE IF NOT EXISTS post_claps (
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

