-- Migration SQL to add security features to users table
-- Run this if you prefer SQL directly

-- Add email_verified column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE NOT NULL;

-- Add failed_login_attempts column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0 NOT NULL;

-- Add locked_until column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;

