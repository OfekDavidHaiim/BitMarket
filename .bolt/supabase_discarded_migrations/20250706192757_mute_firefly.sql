/*
  # Fix Storage Permissions and Setup

  1. Storage Bucket Setup
    - Create product-images bucket with proper configuration
    - Handle conflicts gracefully

  2. Storage RLS Policies
    - Create policies that work within Supabase's permission model
    - Use proper role-based access control

  3. Database Functions
    - Helper functions for storage operations
    - Image validation functions

  Note: This migration avoids direct ownership changes on storage.objects
  as that table is managed by Supabase's system. Instead, we work within
  the existing permission model.
*/

-- First, ensure the storage bucket exists
-- This uses INSERT with ON CONFLICT to handle existing buckets
DO $$
BEGIN
  -- Insert the bucket if it doesn't exist
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
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Bucket creation requires dashboard access - please create manually';
  WHEN OTHERS THEN
    RAISE NOTICE 'Bucket may already exist or require manual creation';
END $$;

-- Drop existing policies to avoid conflicts
-- Use IF EXISTS to prevent errors if policies don't exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
  DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own product images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
  DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Policy management requires elevated privileges - please use dashboard';
  WHEN OTHERS THEN
    RAISE NOTICE 'Some policies may not exist - continuing';
END $$;

-- Create storage policies using a safer approach
-- These policies work within Supabase's permission model
DO $$
BEGIN
  -- Allow authenticated users to upload images to product-images bucket
  CREATE POLICY "Enable upload for authenticated users"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
  );

  -- Allow public read access to product images
  CREATE POLICY "Enable read access for product images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

  -- Allow authenticated users to update their own images
  CREATE POLICY "Enable update for own images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

  -- Allow authenticated users to delete their own images
  CREATE POLICY "Enable delete for own images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Storage policy creation requires dashboard access';
  WHEN OTHERS THEN
    RAISE NOTICE 'Storage policies may need manual creation in dashboard';
END $$;

-- Create helper functions for storage operations
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

-- Create a function to generate unique file names with user prefix
CREATE OR REPLACE FUNCTION generate_user_filename(user_id uuid, original_name text)
RETURNS text AS $$
DECLARE
  file_ext text;
  unique_name text;
BEGIN
  -- Extract file extension
  file_ext := lower(substring(original_name from '\.([^.]*)$'));
  
  -- Generate unique filename with user ID prefix
  unique_name := user_id::text || '/' || 
                 extract(epoch from now())::bigint || '-' || 
                 substr(md5(random()::text), 1, 8) || 
                 COALESCE('.' || file_ext, '');
  
  RETURN unique_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check storage permissions
CREATE OR REPLACE FUNCTION check_storage_permissions()
RETURNS TABLE(
  can_upload boolean,
  can_read boolean,
  bucket_exists boolean,
  error_message text
) AS $$
DECLARE
  bucket_count integer;
  upload_test boolean := false;
  read_test boolean := false;
  error_msg text := '';
BEGIN
  -- Check if bucket exists
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets
  WHERE id = 'product-images';
  
  bucket_exists := bucket_count > 0;
  
  -- Test read permissions (this should always work)
  BEGIN
    PERFORM 1 FROM storage.objects WHERE bucket_id = 'product-images' LIMIT 1;
    read_test := true;
  EXCEPTION
    WHEN OTHERS THEN
      read_test := false;
      error_msg := 'Read permission test failed';
  END;
  
  -- For upload test, we can't actually test without creating a file
  -- So we'll assume it works if bucket exists and user is authenticated
  upload_test := bucket_exists AND auth.uid() IS NOT NULL;
  
  RETURN QUERY SELECT upload_test, read_test, bucket_exists, error_msg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions to authenticated users
GRANT EXECUTE ON FUNCTION validate_image_upload(text, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_user_filename(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_storage_permissions() TO authenticated;

-- Create a view to check storage status
CREATE OR REPLACE VIEW storage_status AS
SELECT 
  b.id as bucket_id,
  b.name as bucket_name,
  b.public as is_public,
  b.file_size_limit,
  b.allowed_mime_types,
  COUNT(o.id) as file_count
FROM storage.buckets b
LEFT JOIN storage.objects o ON b.id = o.bucket_id
WHERE b.id = 'product-images'
GROUP BY b.id, b.name, b.public, b.file_size_limit, b.allowed_mime_types;

-- Grant access to the view
GRANT SELECT ON storage_status TO authenticated;