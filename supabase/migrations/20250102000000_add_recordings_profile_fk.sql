-- Add foreign key constraint from recordings.user_id to profiles.id
-- This allows us to join recordings with profiles for user information

-- Drop both old and new constraints if they exist
ALTER TABLE recordings
DROP CONSTRAINT IF EXISTS recordings_user_id_fkey;

ALTER TABLE recordings
DROP CONSTRAINT IF EXISTS recordings_user_id_profiles_fkey;

-- Add new foreign key constraint to profiles
ALTER TABLE recordings
ADD CONSTRAINT recordings_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
