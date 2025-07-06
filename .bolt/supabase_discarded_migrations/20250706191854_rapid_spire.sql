/*
  # Complete Storage Setup for Product Images

  1. Storage Bucket Creation
    - Create 'product-images' bucket with proper configuration
    - Set public access for viewing images
    - Configure file size and type limits

  2. Storage RLS Policies
    - Allow authenticated users to upload images
    - Allow public read access to images
    - Allow users to manage their own uploaded images

  3. Database Functions
    - Helper functions for storage operations
    - Image validation functions
*/

-- Create the storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;

-- Allow authenticated users to upload images to product-images bucket
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated'
);

-- Allow public read access to product images
CREATE POLICY "Public can view product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow authenticated users to update images in product-images bucket
CREATE POLICY "Users can update own product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete images in product-images bucket
CREATE POLICY "Users can delete own product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create a function to validate image uploads
CREATE OR REPLACE FUNCTION validate_image_upload(file_name text, file_size bigint)
RETURNS boolean AS $$
BEGIN
  -- Check file size (10MB limit)
  IF file_size > 10485760 THEN
    RETURN false;
  END IF;
  
  -- Check file extension
  IF NOT (file_name ~* '\.(jpg|jpeg|png|webp|gif)$') THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_image_upload(text, bigint) TO authenticated;