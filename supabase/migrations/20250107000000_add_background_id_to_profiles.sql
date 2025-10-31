-- Add background_id field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS background_id TEXT DEFAULT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS profiles_background_id_idx ON profiles(background_id);

-- Add comment to explain the column
COMMENT ON COLUMN profiles.background_id IS 'Selected background ID for user card display';
