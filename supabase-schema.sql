-- Create profiles table (synced with auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  email TEXT,
  full_name TEXT DEFAULT '',
  avatar_url TEXT
);

-- Create recordings table
CREATE TABLE IF NOT EXISTS recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  duration NUMERIC NOT NULL,
  likes_count INTEGER DEFAULT 0,
  dislikes_count INTEGER DEFAULT 0,
  title TEXT,
  description TEXT
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_like BOOLEAN NOT NULL,
  UNIQUE(recording_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS recordings_created_at_idx ON recordings(created_at DESC);
CREATE INDEX IF NOT EXISTS likes_recording_id_idx ON likes(recording_id);
CREATE INDEX IF NOT EXISTS likes_user_id_idx ON likes(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Policies for profiles table
CREATE POLICY "Anyone can view profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policies for recordings table
CREATE POLICY "Anyone can view recordings" ON recordings
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert recordings" ON recordings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own recordings" ON recordings
  FOR UPDATE USING (true);

-- Policies for likes table
CREATE POLICY "Anyone can view likes" ON likes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert likes" ON likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own likes" ON likes
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own likes" ON likes
  FOR DELETE USING (true);

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_recording_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_like THEN
      UPDATE recordings SET likes_count = likes_count + 1 WHERE id = NEW.recording_id;
    ELSE
      UPDATE recordings SET dislikes_count = dislikes_count + 1 WHERE id = NEW.recording_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_like <> NEW.is_like THEN
      IF NEW.is_like THEN
        UPDATE recordings SET likes_count = likes_count + 1, dislikes_count = dislikes_count - 1 WHERE id = NEW.recording_id;
      ELSE
        UPDATE recordings SET likes_count = likes_count - 1, dislikes_count = dislikes_count + 1 WHERE id = NEW.recording_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_like THEN
      UPDATE recordings SET likes_count = likes_count - 1 WHERE id = OLD.recording_id;
    ELSE
      UPDATE recordings SET dislikes_count = dislikes_count - 1 WHERE id = OLD.recording_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update likes count
DROP TRIGGER IF EXISTS update_recording_likes_count_trigger ON likes;
CREATE TRIGGER update_recording_likes_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_recording_likes_count();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
