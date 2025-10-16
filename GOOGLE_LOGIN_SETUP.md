# 🔐 Google Login Setup Guide

Hướng dẫn chi tiết cách setup Google OAuth login cho Just Voice app.

## 📋 Yêu cầu

- Đã setup Supabase project (xem `SETUP.md`)
- Google account để tạo OAuth credentials

---

## 🚀 Bước 1: Setup Google OAuth Credentials

### 1.1. Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"NEW PROJECT"**
3. Đặt tên project (ví dụ: "Just Voice")
4. Click **"Create"**

### 1.2. Enable Google+ API

1. Trong Google Cloud Console, vào **"APIs & Services"** → **"Library"**
2. Search **"Google+ API"**
3. Click vào và chọn **"Enable"**

### 1.3. Tạo OAuth 2.0 Credentials

1. Vào **"APIs & Services"** → **"Credentials"**
2. Click **"CREATE CREDENTIALS"** → **"OAuth client ID"**

3. Nếu chưa có OAuth consent screen:
   - Click **"CONFIGURE CONSENT SCREEN"**
   - Chọn **"External"** → Click **"CREATE"**
   - Điền thông tin cơ bản:
     - App name: `Just Voice`
     - User support email: Email của bạn
     - Developer contact: Email của bạn
   - Click **"SAVE AND CONTINUE"**
   - Skip qua phần Scopes → Click **"SAVE AND CONTINUE"**
   - Skip qua phần Test users → Click **"SAVE AND CONTINUE"**
   - Click **"BACK TO DASHBOARD"**

4. Tạo OAuth Client ID:
   - Application type: **"Web application"**
   - Name: `Just Voice Web Client`

5. Thêm **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   http://localhost:5174
   http://localhost:5175
   https://your-production-domain.com
   ```

6. Thêm **Authorized redirect URIs**:
   ```
   https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
   ```

   **Lưu ý**: Thay `YOUR_SUPABASE_PROJECT_REF` bằng project ref của bạn

   Ví dụ: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`

7. Click **"CREATE"**

8. **LƯU LẠI**:
   - ✅ Client ID
   - ✅ Client Secret

---

## 🔧 Bước 2: Cấu hình Supabase

### 2.1. Enable Google Provider

1. Vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **"Authentication"** → **"Providers"**
4. Tìm **"Google"** và click để mở rộng

### 2.2. Điền thông tin Google OAuth

1. Enable **"Google enabled"** toggle
2. Paste **Client ID** từ Google Cloud Console
3. Paste **Client Secret** từ Google Cloud Console
4. Click **"Save"**

### 2.3. Lấy Redirect URL từ Supabase

1. Copy **"Redirect URL"** từ Supabase (ở phần Google provider settings)
2. Đảm bảo URL này đã được thêm vào Google Cloud Console (Bước 1.3.6)

**Format**: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

---

## 📝 Bước 3: Update Database Schema

Chạy SQL này trong Supabase SQL Editor để tạo bảng `profiles`:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email, onboarded)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email,
    FALSE  -- New users need onboarding
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## ✅ Bước 4: Test Google Login

### 4.1. Development Test

1. Chạy app: `pnpm dev`
2. Mở browser: `http://localhost:5173`
3. Click nút **"Sign in"**
4. Click **"Continue with Google"**
5. Chọn Google account
6. Nếu thành công → Redirect về app với user logged in

### 4.2. Kiểm tra User Data

1. Vào Supabase Dashboard → **"Authentication"** → **"Users"**
2. Xem user vừa login có trong list không
3. Check thông tin:
   - Email
   - Full name
   - Avatar URL
   - Provider: `google`

---

## 🚨 Troubleshooting

### Lỗi: "redirect_uri_mismatch"

**Nguyên nhân**: Redirect URI không khớp

**Fix**:
1. Check lại Redirect URI trong Google Cloud Console
2. Đảm bảo format chính xác: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
3. Không có trailing slash `/` ở cuối
4. Đợi 5-10 phút để Google cập nhật

### Lỗi: "Access blocked: This app's request is invalid"

**Nguyên nhân**: Chưa setup OAuth consent screen hoặc thiếu scope

**Fix**:
1. Setup OAuth consent screen (Bước 1.3.3)
2. Thêm scope: `email`, `profile`, `openid`

### Lỗi: "User not found" sau khi login

**Nguyên nhân**: Chưa tạo bảng `profiles` hoặc trigger

**Fix**:
1. Chạy lại SQL từ Bước 3
2. Kiểm tra trigger đã được tạo:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

### Login thành công nhưng không có avatar

**Nguyên nhân**: Google không trả về avatar_url

**Fix**:
- Code đã handle fallback tự động dùng DiceBear avatar
- Check trong `App.tsx` và `Profile.tsx`

---

## 🔐 Security Best Practices

✅ **Đã implement**:
- Row Level Security (RLS) enabled
- Profiles table với policies an toàn
- Trigger tự động tạo profile
- Fallback avatar nếu Google không có

⚠️ **Lưu ý**:
- Không commit `.env` file
- Không share Client Secret
- Production: Thêm domain thật vào Authorized origins
- Luôn dùng HTTPS trên production

---

## 📱 Production Deployment

Khi deploy lên production (Vercel, Netlify, etc.):

1. **Update Google Cloud Console**:
   - Thêm production domain vào **Authorized JavaScript origins**:
     ```
     https://your-domain.com
     ```

2. **Update Supabase**:
   - Vào **Authentication** → **URL Configuration**
   - Thêm production URL vào **Site URL**
   - Thêm vào **Redirect URLs**

3. **Environment Variables**:
   - Đảm bảo `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` đúng

---

## 📚 Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google Auth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

## ✨ Done!

Giờ app của bạn đã có Google login rồi! 🎉

User có thể:
- ✅ Login bằng Google account
- ✅ Tự động tạo profile
- ✅ Avatar từ Google hoặc DiceBear
- ✅ Quản lý profile trong Profile page

Có vấn đề gì cứ hỏi nhé! 😊
