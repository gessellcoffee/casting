# Profile Feature Setup Guide

This guide explains how to set up the profile editing feature with image and resume uploads.

## Features Implemented

✅ **Profile Photo Upload** - Upload and display profile photos  
✅ **Resume Upload** - Upload PDF/DOC/DOCX resume files  
✅ **Image Gallery** - Upload multiple images (up to 10)  
✅ **Profile Fields** - First name, middle name, last name, username, bio  
✅ **Edit Mode** - Toggle between view and edit modes  
✅ **Real-time Updates** - Changes are saved to Supabase database  

## Database Setup

### 1. Profiles Table

The profiles table should already exist based on your schema. Verify it has these columns:

```sql
create table public.profiles (
  id uuid not null,
  first_name character varying(255) null,
  middle_name character varying(255) null,
  last_name character varying(255) null,
  profile_photo_url character varying(255) null,
  description text null,
  resume_url character varying(255) null,
  image_gallery jsonb null,
  video_gallery jsonb null,
  skills jsonb null,
  education jsonb null,
  preferences jsonb null,
  created_at timestamp with time zone not null default now(),
  username character varying not null,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade
);
```

### 2. Storage Bucket Setup

You need to create a storage bucket in Supabase for file uploads:

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket called `profiles`
3. Set the bucket to **Public** (or configure RLS policies)
4. Create the following folder structure (optional, will be created automatically):
   - `profile-photos/`
   - `resumes/`
   - `gallery/`

### 3. Storage Policies (RLS)

**IMPORTANT**: Run these SQL commands in your Supabase SQL Editor to fix the RLS error.

#### Option A: Simplified Policies (Recommended for Development)

```sql
-- Allow authenticated users to upload to profiles bucket
CREATE POLICY "Authenticated users can upload to profiles"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profiles');

-- Allow authenticated users to update profiles files
CREATE POLICY "Authenticated users can update profiles files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profiles');

-- Allow authenticated users to delete profiles files
CREATE POLICY "Authenticated users can delete profiles files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profiles');

-- Allow everyone to read files (for public profiles)
CREATE POLICY "Anyone can view profiles files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profiles');
```

#### Option B: User-Specific Policies (Recommended for Production)

Files are stored with userId as the first folder (e.g., `{userId}/profile-photos/photo.jpg`), so users can only access their own files:

```sql
-- Allow users to upload files with their user ID in the path
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access
CREATE POLICY "Public can view files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profiles');
```

### 4. Profile Table Policies (RLS)

Ensure your profiles table has proper RLS policies:

```sql
-- Enable RLS
alter table public.profiles enable row level security;

-- Allow users to view their own profile
create policy "Users can view own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id);

-- Allow users to insert their own profile
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);
```

## Profile Creation Trigger

You may want to automatically create a profile when a user signs up. Add this trigger:

```sql
-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## Usage

### Viewing Profile

1. Navigate to `/profile`
2. View your profile information
3. Click **Edit Profile** to enter edit mode

### Editing Profile

1. Click **Edit Profile** button
2. Update any fields:
   - **Profile Photo**: Click "Change Photo" to upload a new image
   - **Name Fields**: Enter first, middle, and last name
   - **Username**: Update your username
   - **Bio**: Write a description about yourself
   - **Resume**: Upload a PDF, DOC, or DOCX file
   - **Image Gallery**: Add up to 10 images
3. Click **Save Changes** to persist updates
4. Click **Cancel** to discard changes

### File Upload Specifications

- **Profile Photo**: Any image format (JPG, PNG, GIF, etc.)
- **Resume**: PDF, DOC, or DOCX files
- **Gallery Images**: Any image format, maximum 10 images

## File Structure

```
src/
├── app/
│   └── profile/
│       └── page.tsx              # Main profile page with edit functionality
├── components/
│   └── ImageGalleryUpload.tsx    # Image gallery upload component
└── lib/
    └── supabase/
        ├── types.ts              # Updated database types
        ├── profile.ts            # Profile CRUD operations
        ├── storage.ts            # File upload utilities
        └── index.ts              # Exports
```

## Troubleshooting

### Images not uploading?
- Check that the `profiles` storage bucket exists
- Verify storage policies are correctly configured
- Check browser console for errors

### Profile not loading?
- Ensure the user has a profile record in the database
- Check that RLS policies allow the user to read their profile
- Verify the trigger is creating profiles on signup

### Changes not saving?
- Check browser console for errors
- Verify RLS policies allow updates
- Ensure all required fields are filled (username is required)

## Next Steps

Consider adding:
- Video gallery upload functionality
- Skills and education management
- Profile visibility settings
- Profile sharing/public view
- Image cropping/editing before upload
- File size limits and validation
