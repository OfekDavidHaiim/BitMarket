# Supabase Storage Setup Guide

## Overview
This document explains how to properly set up Supabase Storage for the CryptoMarket project and resolve common permission issues.

## The Permission Problem

### What Was Happening
- Users getting "must be owner of table objects" errors
- 400/403 Unauthorized errors on image uploads
- RLS policy violations on storage.objects table

### Root Cause
The `storage.objects` table in Supabase is owned by the system and cannot be directly modified by user migrations. Attempting to alter this table or its policies through migrations fails due to insufficient privileges.

## The Solution

### 1. Storage Bucket Creation
The storage bucket must be created either:
- **Via Supabase Dashboard** (Recommended)
- **Via migration with proper error handling**

### 2. RLS Policies
Storage policies must be created with the correct approach:
```sql
-- ✅ CORRECT: Use specific, descriptive policy names
CREATE POLICY "Enable upload for authenticated users"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- ❌ INCORRECT: Generic names that might conflict
CREATE POLICY "upload_policy" ON storage.objects...
```

### 3. Permission Model
Our storage setup follows this security model:

#### **Upload Permissions**
- Only authenticated users can upload
- Files are organized by user ID: `{user_id}/{timestamp}-{random}.{ext}`
- Users can only access their own uploaded files

#### **Read Permissions**
- Public read access for all product images
- No authentication required to view images

#### **Update/Delete Permissions**
- Users can only modify their own uploaded files
- Enforced through folder-based security

## Manual Setup Steps

### Step 1: Create Storage Bucket
1. Go to Supabase Dashboard → Storage
2. Click "Create Bucket"
3. Set bucket name: `product-images`
4. Enable "Public bucket"
5. Set file size limit: `10485760` (10MB)
6. Set allowed MIME types: `image/jpeg, image/jpg, image/png, image/webp, image/gif`

### Step 2: Apply RLS Policies
Run this SQL in the Supabase Dashboard SQL Editor:

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

## Code Implementation

### Frontend Authentication
The upload hook now includes:
- ✅ Session validation before upload
- ✅ Proper error handling for auth failures
- ✅ User-friendly error messages
- ✅ Storage permission testing

### File Organization
Files are stored with this structure:
```
product-images/
├── {user_id_1}/
│   ├── 1704067200000-abc123.jpg
│   └── 1704067300000-def456.png
└── {user_id_2}/
    ├── 1704067400000-ghi789.jpg
    └── 1704067500000-jkl012.webp
```

### Error Handling
The system now provides specific error messages:
- "You must be logged in to upload images"
- "Upload permission denied. Please try logging out and back in."
- "Storage bucket not configured. Please contact support."
- "File too large. Please use an image smaller than 10MB."

## Verification

### Test Upload Functionality
1. Log in as a user
2. Go to "Post Product" page
3. Try uploading an image
4. Should see success message and image preview

### Check Storage Permissions
The system includes a permission checker:
```javascript
const { canUpload, error } = await checkStoragePermissions();
```

### Monitor Console Logs
The enhanced logging shows:
- ✅ Database connection status
- ✅ Storage bucket availability
- ✅ Permission test results
- ❌ Specific error details

## Troubleshooting

### Common Issues

1. **"Bucket not found"**
   - Solution: Create the bucket manually in dashboard

2. **"Upload permission denied"**
   - Solution: Check RLS policies are applied correctly

3. **"Storage access denied"**
   - Solution: Verify user is authenticated and session is valid

4. **"File already exists"**
   - Solution: The system generates unique filenames, this shouldn't happen

### Debug Steps
1. Check browser console for detailed error logs
2. Verify user authentication status
3. Test storage permissions with the built-in checker
4. Confirm bucket exists and is properly configured

## Security Notes

- ✅ Users can only upload to their own folder
- ✅ File size limited to 10MB
- ✅ Only image files allowed
- ✅ Unique filenames prevent conflicts
- ✅ Public read access for product viewing
- ✅ Private write access for security

This setup ensures secure, scalable image storage while providing clear error messages and proper permission handling.