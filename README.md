# 🎙️ Voice Recorder - Record Strangers

A web application that allows users to record audio, share it publicly, and interact with recordings through likes/dislikes. Built with modern web technologies.

## ✨ Features

- **🎤 Audio Recording**: Click to record audio directly from your browser using MediaRecorder API
- **⏸️ Pause/Resume**: Control your recording with pause and resume functionality
- **📤 Cloud Upload**: Automatically upload recordings to Supabase Storage
- **🌊 Waveform Visualization**: Interactive waveform display using WaveSurfer.js
- **👍👎 Like/Dislike**: React to recordings with likes and dislikes
- **📱 Responsive Design**: Beautiful UI built with Tailwind CSS
- **⚡ Real-time Updates**: Feed updates automatically when new recordings are posted
- **🔐 Anonymous Support**: No login required - uses local storage for anonymous users

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL + Storage)
- **Audio**: MediaRecorder API + WaveSurfer.js
- **Build Tool**: Vite
- **Package Manager**: pnpm

## 📋 Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Supabase account

## 🚀 Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo>
cd record-strangers
pnpm install
```

### 2. Supabase Setup

#### Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be ready

#### Setup Environment Variables
1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your Supabase credentials in `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### Setup Database
1. Go to Supabase Dashboard → **SQL Editor**
2. Run all SQL commands from `supabase-schema.sql`
3. This creates:
   - `recordings` table
   - `likes` table
   - Indexes for performance
   - Row Level Security (RLS) policies
   - Triggers for auto-updating like counts

#### Setup Storage
1. Go to Supabase Dashboard → **Storage**
2. Create a new bucket:
   - Name: `audio-recordings`
   - Set as **Public**
3. Go to **Policies** tab for the bucket
4. Add storage policies (see `SETUP.md` for details)

### 3. Run the Application

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173)

## 📁 Project Structure

```
record-strangers/
├── src/
│   ├── components/
│   │   ├── AudioRecorder.tsx    # Recording component
│   │   ├── AudioCard.tsx        # Individual recording card with player
│   │   └── Feed.tsx             # List of all recordings
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   └── database.types.ts    # TypeScript types
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
├── supabase-schema.sql          # Database schema
├── SETUP.md                     # Detailed setup guide
└── package.json
```

## 🎯 How It Works

### Recording Flow
1. User clicks "Start Recording" button
2. Browser requests microphone permission
3. MediaRecorder API captures audio
4. User can pause/resume or stop recording
5. Audio preview is shown
6. User uploads to Supabase Storage
7. Metadata saved to PostgreSQL database
8. Feed updates automatically

### Like/Dislike Flow
1. Anonymous user ID is generated and stored in localStorage
2. User clicks like or dislike button
3. Action is recorded in `likes` table
4. Database trigger automatically updates counts in `recordings` table
5. UI updates immediately

## 🔧 Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
```

## 📊 Database Schema

### recordings table
- `id`: UUID (primary key)
- `created_at`: Timestamp
- `user_id`: UUID (nullable, for future auth)
- `file_url`: Text (Supabase Storage URL)
- `duration`: Numeric (seconds)
- `likes_count`: Integer
- `dislikes_count`: Integer

### likes table
- `id`: UUID (primary key)
- `created_at`: Timestamp
- `recording_id`: UUID (foreign key)
- `user_id`: UUID (nullable, anonymous user ID)
- `is_like`: Boolean (true = like, false = dislike)

## 🎨 Features in Detail

### Audio Recording
- Uses browser's MediaRecorder API
- Supports pause/resume functionality
- Records in WebM format
- Real-time duration display

### Waveform Visualization
- Powered by WaveSurfer.js
- Interactive playback controls
- Visual feedback during playback
- Responsive design

### Like System
- Anonymous users supported
- Toggle likes/dislikes
- Change your reaction
- Real-time count updates via database triggers

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Public read access for recordings
- Anonymous insert/update allowed (can be restricted later)
- Storage bucket policies configured
- No sensitive data exposed

## 🚧 Future Enhancements

- [ ] User authentication (email/social login)
- [ ] User profiles
- [ ] Comments on recordings
- [ ] Share recordings (social media integration)
- [ ] Search and filter recordings
- [ ] Categories/tags for recordings
- [ ] Download recordings
- [ ] Report inappropriate content
- [ ] Admin dashboard

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, please open an issue in the GitHub repository.

---

Built with ❤️ using React + TypeScript + Supabase + Tailwind CSS
# strangers-voice
