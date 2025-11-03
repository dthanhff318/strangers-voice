-- Create live_rooms table
CREATE TABLE IF NOT EXISTS live_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  listeners_count INTEGER DEFAULT 0 NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS live_rooms_host_id_idx ON live_rooms(host_id);
CREATE INDEX IF NOT EXISTS live_rooms_is_active_idx ON live_rooms(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS live_rooms_created_at_idx ON live_rooms(created_at DESC);

-- Enable Row Level Security
ALTER TABLE live_rooms ENABLE ROW LEVEL SECURITY;

-- Policies for live_rooms table
CREATE POLICY "Anyone can view active live rooms" ON live_rooms
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create live rooms" ON live_rooms
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their own live rooms" ON live_rooms
  FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their own live rooms" ON live_rooms
  FOR DELETE USING (auth.uid() = host_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_live_room_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_live_room_updated_at_trigger ON live_rooms;
CREATE TRIGGER update_live_room_updated_at_trigger
  BEFORE UPDATE ON live_rooms
  FOR EACH ROW EXECUTE FUNCTION update_live_room_updated_at();

-- Enable Realtime for live_rooms
ALTER PUBLICATION supabase_realtime ADD TABLE live_rooms;
