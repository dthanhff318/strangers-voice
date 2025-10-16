# Setup Instructions

## 1. Supabase Setup

### Create a Supabase Project
1. Go to https://supabase.com
2. Create a new project
3. Copy your project URL and anon key

### Environment Variables
1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Database Setup
1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL commands from `supabase-schema.sql`
3. This will create:
   - `recordings` table
   - `likes` table
   - Necessary indexes and RLS policies
   - Triggers for auto-updating like counts

### Storage Setup
1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `audio-recordings`
3. Set bucket as **public**
4. Add the following policy for the bucket:

**Policy for INSERT (Upload)**
```sql
CREATE POLICY "Anyone can upload audio files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio-recordings');
```

**Policy for SELECT (Download/View)**
```sql
CREATE POLICY "Anyone can view audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-recordings');
```

## 2. Run the Application

```bash
pnpm install
pnpm dev
```

## Features
- 🎙️ Record audio from browser
- 📤 Upload to Supabase Storage
- 📱 Feed page with audio cards
- 👍 Like/Dislike functionality
- 🌊 Waveform visualization
