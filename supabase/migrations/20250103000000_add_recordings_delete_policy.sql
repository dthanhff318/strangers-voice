-- Add policy to allow users to delete their own recordings
CREATE POLICY "Users can delete their own recordings" ON recordings
  FOR DELETE USING (auth.uid() = user_id);
