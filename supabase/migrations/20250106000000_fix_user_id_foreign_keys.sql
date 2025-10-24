-- Fix foreign key constraints for likes and reports tables
-- Change from auth.users to profiles for consistency

-- Drop all existing foreign key constraints (both old and new)
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_user_id_profiles_fkey;

ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_user_id_fkey;
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_user_id_profiles_fkey;

-- Add new foreign key constraints to profiles table
ALTER TABLE likes
ADD CONSTRAINT likes_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE reports
ADD CONSTRAINT reports_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
