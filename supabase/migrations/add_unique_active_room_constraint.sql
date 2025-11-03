-- Migration: Add unique constraint to prevent multiple active rooms per host
-- This ensures each user can only have one active live room at a time

-- Create a unique partial index on live_rooms table
-- This index only applies to rows where is_active = true
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_room_per_host
ON live_rooms (host_id)
WHERE is_active = true;

-- Add a comment explaining the constraint
COMMENT ON INDEX unique_active_room_per_host IS 'Ensures each host can only have one active live room at a time';
