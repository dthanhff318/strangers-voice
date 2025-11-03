-- Create live_chat_messages table
CREATE TABLE IF NOT EXISTS live_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  room_id UUID REFERENCES live_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  CONSTRAINT message_not_empty CHECK (length(trim(message)) > 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS live_chat_messages_room_id_idx ON live_chat_messages(room_id);
CREATE INDEX IF NOT EXISTS live_chat_messages_created_at_idx ON live_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS live_chat_messages_room_created_idx ON live_chat_messages(room_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for live_chat_messages table
CREATE POLICY "Anyone can view chat messages in active rooms" ON live_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM live_rooms
      WHERE live_rooms.id = live_chat_messages.room_id
      AND live_rooms.is_active = true
    )
  );

CREATE POLICY "Authenticated users can send messages to active rooms" ON live_chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM live_rooms
      WHERE live_rooms.id = live_chat_messages.room_id
      AND live_rooms.is_active = true
    )
  );

-- Enable Realtime for live_chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE live_chat_messages;
