-- RPC function to increment listeners count
CREATE OR REPLACE FUNCTION increment_listeners(room_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE live_rooms
  SET listeners_count = listeners_count + 1
  WHERE id = room_id AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to decrement listeners count
CREATE OR REPLACE FUNCTION decrement_listeners(room_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE live_rooms
  SET listeners_count = GREATEST(0, listeners_count - 1)
  WHERE id = room_id AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
