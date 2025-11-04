-- Add membership fields to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plan_upgraded_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_current_plan_id_idx ON profiles(current_plan_id);

-- Add comment to explain the columns
COMMENT ON COLUMN profiles.current_plan_id IS 'Current VIP plan of the user (NULL means free tier)';
COMMENT ON COLUMN profiles.plan_upgraded_at IS 'Timestamp when user upgraded to current plan';
COMMENT ON COLUMN profiles.plan_expires_at IS 'Expiration date for subscription (NULL means lifetime/no expiration)';
