-- Add foreign key constraint from recordings.user_id to profiles.id
-- This allows us to join recordings with profiles for user information
ALTER TABLE recordings
ADD CONSTRAINT recordings_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
