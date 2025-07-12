/*
  # Create Product Images Storage Bucket

  1. Storage Setup
    - Create `product-images` bucket with proper configuration
    - Set public access for viewing images
    - Configure file size limits and allowed types

  2. Security Policies
    - Enable RLS on storage.objects
    - Allow authenticated users to upload images
    - Allow public read access for product images
    - Restrict users to manage only their own images

  3. Bucket Configuration
    - Public bucket for easy image access
    - 10MB file size limit
    - Image file types only (JPG, PNG, WebP, GIF)
*/

-- Create the storage bucket if it doesn't exist
DO $$
BEGIN
  -- Insert bucket configuration
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'product-images',
    'product-images', 
    true,
    10485760, -- 10MB in bytes
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  )
  ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  RAISE NOTICE 'Storage bucket "product-images" created/updated successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Note: Storage bucket creation may require dashboard access. Error: %', SQLERRM;
END $$;

-- Enable RLS on storage.objects if not already enabled
DO $$
BEGIN
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'RLS enabled on storage.objects';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Note: RLS policy changes may require dashboard access';
  WHEN OTHERS THEN
    RAISE NOTICE 'RLS may already be enabled or requires dashboard access';
END $$;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
  DROP POLICY IF EXISTS "Enable upload for authenticated users" ON storage.objects;
  DROP POLICY IF EXISTS "Enable read access for product images" ON storage.objects;
  DROP POLICY IF EXISTS "Enable update for own images" ON storage.objects;
  DROP POLICY IF EXISTS "Enable delete for own images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
  DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own product images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects;
  RAISE NOTICE 'Existing storage policies dropped';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Some policies may not exist or require dashboard access to modify';
END $$;

-- Create storage policies for product images
DO $$
BEGIN
  -- Allow authenticated users to upload images to product-images bucket
  CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

  -- Allow public read access to product images
  CREATE POLICY "Public can view product images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

  -- Allow users to update their own images
  CREATE POLICY "Users can update own product images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

  -- Allow users to delete their own images
  CREATE POLICY "Users can delete own product images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

  RAISE NOTICE 'Storage policies created successfully';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Note: Storage policy creation requires dashboard access. Please run the following in Supabase SQL Editor:';
    RAISE NOTICE 'CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''product-images'');';
    RAISE NOTICE 'CREATE POLICY "Public can view product images" ON storage.objects FOR SELECT TO public USING (bucket_id = ''product-images'');';
  WHEN OTHERS THEN
    RAISE NOTICE 'Storage policies may require dashboard access. Error: %', SQLERRM;
END $$;

-- Verify the setup
DO $$
DECLARE
  bucket_exists boolean;
  policy_count integer;
BEGIN
  -- Check if bucket exists
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'product-images') INTO bucket_exists;
  
  -- Check policy count
  SELECT COUNT(*) FROM pg_policies 
  WHERE tablename = 'objects' AND schemaname = 'storage' 
  AND policyname LIKE '%product%' INTO policy_count;
  
  IF bucket_exists THEN
    RAISE NOTICE '✅ Storage bucket "product-images" is configured';
  ELSE
    RAISE NOTICE '❌ Storage bucket "product-images" not found - may need manual creation';
  END IF;
  
  IF policy_count > 0 THEN
    RAISE NOTICE '✅ Storage policies configured (% policies found)', policy_count;
  ELSE
    RAISE NOTICE '❌ No storage policies found - may need manual creation';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Verification completed with some limitations';
END $$;