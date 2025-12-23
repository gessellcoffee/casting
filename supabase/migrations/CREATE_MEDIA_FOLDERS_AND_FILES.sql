-- Create media folders table for hierarchical folder structure
CREATE TABLE IF NOT EXISTS media_folders (
  media_folder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES media_folders(media_folder_id) ON DELETE CASCADE,
  folder_name TEXT NOT NULL,
  folder_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique folder names within the same parent or root level
  CONSTRAINT unique_folder_name_per_parent UNIQUE (user_id, parent_folder_id, folder_name)
);

-- Create media files table for storing video information
CREATE TABLE IF NOT EXISTS media_files (
  media_file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES media_folders(media_folder_id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- e.g., 'video/mp4', 'video/quicktime'
  file_size BIGINT, -- File size in bytes
  duration INTEGER, -- Duration in seconds
  thumbnail_url TEXT,
  description TEXT,
  file_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_media_folders_user_id ON media_folders(user_id);
CREATE INDEX idx_media_folders_parent_id ON media_folders(parent_folder_id);
CREATE INDEX idx_media_files_user_id ON media_files(user_id);
CREATE INDEX idx_media_files_folder_id ON media_files(folder_id);

-- Enable RLS
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_folders

-- Users can view their own folders
CREATE POLICY "Users can view own folders" ON media_folders
FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own folders
CREATE POLICY "Users can insert own folders" ON media_folders
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own folders
CREATE POLICY "Users can update own folders" ON media_folders
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can delete their own folders
CREATE POLICY "Users can delete own folders" ON media_folders
FOR DELETE USING (auth.uid() = user_id);

-- Production team can view all folders for viewing profiles
CREATE POLICY "Production team can view all folders" ON media_folders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
  )
);

-- RLS Policies for media_files

-- Users can view their own files
CREATE POLICY "Users can view own files" ON media_files
FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own files
CREATE POLICY "Users can insert own files" ON media_files
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own files
CREATE POLICY "Users can update own files" ON media_files
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can delete their own files
CREATE POLICY "Users can delete own files" ON media_files
FOR DELETE USING (auth.uid() = user_id);

-- Production team can view all files for viewing profiles
CREATE POLICY "Production team can view all files" ON media_files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
  )
);

-- Create storage bucket for media files (videos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-files', 'media-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for media-files bucket

-- Users can upload their own media files
CREATE POLICY "Users can upload own media files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own media files
CREATE POLICY "Users can view own media files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'media-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own media files
CREATE POLICY "Users can update own media files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'media-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own media files
CREATE POLICY "Users can delete own media files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can view media files (for public profile viewing)
CREATE POLICY "Anyone can view media files"
ON storage.objects FOR SELECT
USING (bucket_id = 'media-files');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_media_folders_updated_at
  BEFORE UPDATE ON media_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_media_updated_at();

CREATE TRIGGER update_media_files_updated_at
  BEFORE UPDATE ON media_files
  FOR EACH ROW
  EXECUTE FUNCTION update_media_updated_at();
