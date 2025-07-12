# Supabase Storage Troubleshooting Guide

## Quick Checklist for Storage Issues

### 1. Environment Variables ✅
Check your `.env` file contains:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**After any changes to .env, restart your development server!**

### 2. Storage Bucket Setup ✅
In your Supabase Dashboard → Storage:

1. **Bucket exists**: Look for a bucket named `product-images`
2. **Public bucket**: Must be enabled
3. **File size limit**: Set to `10MB` (10485760 bytes)
4. **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp, image/gif`

### 3. Row Level Security (RLS) Policies ✅
In Supabase Dashboard → SQL Editor, run these commands:

```sql
-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable upload for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable read access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for own images" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for own images" ON storage.objects;

-- Create new policies
CREATE POLICY "Enable upload for authenticated users"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Enable read access for product images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Enable update for own images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Enable delete for own images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## Common Error Messages & Solutions

### "Storage access denied. Please check your Supabase URL/Anon Key"
- ❌ **Problem**: Invalid environment variables
- ✅ **Solution**: Check `.env` file and restart dev server

### "Storage bucket 'product-images' not found"
- ❌ **Problem**: Bucket doesn't exist
- ✅ **Solution**: Create bucket in Supabase Dashboard

### "Upload permission denied. Please ensure RLS policies are configured"
- ❌ **Problem**: Missing or incorrect RLS policies
- ✅ **Solution**: Apply the SQL policies above

### "Network error. Please check your internet connection"
- ❌ **Problem**: Network connectivity issues
- ✅ **Solution**: Check internet connection and Supabase status

### "You must be logged in to upload images"
- ❌ **Problem**: User not authenticated
- ✅ **Solution**: Log in before attempting upload

## Step-by-Step Setup Process

### Step 1: Create Storage Bucket
1. Go to Supabase Dashboard
2. Navigate to Storage section
3. Click "Create Bucket"
4. Name: `product-images`
5. Enable "Public bucket"
6. Set file size limit: 10MB
7. Set allowed MIME types: `image/jpeg, image/jpg, image/png, image/webp, image/gif`

### Step 2: Apply RLS Policies
1. Go to SQL Editor in Supabase Dashboard
2. Copy and paste the SQL policies from above
3. Click "Run" to execute

### Step 3: Verify Environment Variables
1. Check your `.env` file
2. Ensure both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Restart your development server

### Step 4: Test Upload
1. Log in to your application
2. Navigate to the product creation page
3. Try uploading an image
4. Check browser console for any remaining errors

## Testing Your Setup

The application includes built-in diagnostics. When you try to upload:

1. **Storage Status Check**: Automatically verifies bucket existence and permissions
2. **Detailed Error Messages**: Shows specific issues (missing bucket, wrong policies, etc.)
3. **Retry Mechanism**: Allows retrying failed uploads
4. **Console Logging**: Detailed logs in browser console for debugging

## Manual Verification Commands

Run these in Supabase SQL Editor to verify your setup:

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'product-images';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Test bucket access (replace with your user ID)
SELECT * FROM storage.objects WHERE bucket_id = 'product-images' LIMIT 5;
```

## Still Having Issues?

1. **Check Supabase Status**: Visit status.supabase.com
2. **Browser Console**: Look for detailed error messages
3. **Network Tab**: Check if requests are reaching Supabase
4. **Supabase Logs**: Check your project logs in Supabase Dashboard

The improved error handling will now show you exactly what's wrong instead of generic "Unable to access storage" messages.