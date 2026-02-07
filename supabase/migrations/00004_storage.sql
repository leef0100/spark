-- Spark Dating App - Storage Configuration
-- Migration: 00004_storage.sql

-- ============================================
-- STORAGE BUCKET: profile-photos
-- ============================================

-- Create the storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-photos',
    'profile-photos',
    true, -- Public read access
    1048576, -- 1MB max file size
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own photos
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to all photos
CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');
