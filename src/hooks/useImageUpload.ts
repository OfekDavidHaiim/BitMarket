import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { user, session } = useAuth();

  const uploadImage = async (file: File, bucket: string = 'product-images') => {
    try {
      setUploading(true);

      // Check if user is authenticated
      if (!user || !session) {
        throw new Error('You must be logged in to upload images');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image size must be less than 10MB');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExt)) {
        throw new Error('Unsupported file format. Please use JPG, PNG, WebP, or GIF');
      }

      // Create unique filename with user ID prefix for better organization and security
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type);
      console.log('User authenticated:', !!user, 'Session valid:', !!session?.access_token);

      // Check storage access with specific error messages
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Storage access error:', bucketsError);
        if (bucketsError.message.includes('Invalid API key') || bucketsError.message.includes('unauthorized')) {
          throw new Error('Storage access denied. Please check your Supabase URL/Anon Key or network connection.');
        } else if (bucketsError.message.includes('Failed to fetch') || bucketsError.message.includes('network')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        } else {
          throw new Error(`Storage access error: ${bucketsError.message}`);
        }
      }
      
      const productBucket = buckets?.find(b => b.name === bucket);
      if (!productBucket) {
        throw new Error(`Storage bucket '${bucket}' not found. Please create it in Supabase Dashboard.`);
      }
      
      console.log('Storage bucket found:', productBucket);

      // Upload to Supabase Storage with explicit options
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false, // Don't overwrite existing files
        });

      if (error) {
        console.error('Storage upload error:', error);
        
        // Handle specific error cases with user-friendly messages
        if (error.message.includes('row-level security')) {
          throw new Error('Upload permission denied. Please ensure RLS policies are configured correctly.');
        } else if (error.message.includes('Bucket not found')) {
          throw new Error('Storage bucket not configured. Please create the product-images bucket in Supabase Dashboard.');
        } else if (error.message.includes('Duplicate')) {
          throw new Error('File already exists. Please try again.');
        } else if (error.message.includes('Unauthorized') || error.message.includes('403')) {
          throw new Error('Upload not authorized. Please check your login status and storage policies.');
        } else if (error.message.includes('413') || error.message.includes('too large')) {
          throw new Error('File too large. Please use an image smaller than 10MB.');
        } else if (error.message.includes('415') || error.message.includes('type')) {
          throw new Error('Invalid file type. Please use JPG, PNG, WebP, or GIF.');
        } else if (error.message.includes('Invalid API key')) {
          throw new Error('Invalid Supabase configuration. Please check your environment variables.');
        } else {
          throw new Error(`Upload failed: ${error.message}`);
        }
      }

      if (!data?.path) {
        throw new Error('Upload completed but no file path returned');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      console.log('Upload successful:', publicUrl);
      return { url: publicUrl, error: null };

    } catch (err) {
      console.error('Error uploading image:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      return { url: null, error: errorMessage };
    } finally {
      setUploading(false);
    }
  };

  const uploadMultipleImages = async (files: File[], bucket: string = 'product-images') => {
    console.log('Starting multiple image upload:', files.length, 'files');
    
    // Check authentication first
    if (!user || !session) {
      return { 
        urls: [], 
        errors: ['You must be logged in to upload images'] 
      };
    }
    
    const results = await Promise.all(
      files.map(file => uploadImage(file, bucket))
    );

    const urls = results
      .filter(result => result.url)
      .map(result => result.url!);

    const errors = results
      .filter(result => result.error)
      .map(result => result.error!);

    console.log('Upload results:', { urls: urls.length, errors: errors.length });
    
    return { urls, errors };
  };

  // Function to check storage permissions with detailed diagnostics
  const checkStoragePermissions = async () => {
    try {
      if (!user) {
        return { canUpload: false, error: 'Not authenticated' };
      }

      // Test environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        return { 
          canUpload: false, 
          error: 'Missing Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file.' 
        };
      }

      console.log('🔍 Checking storage permissions...');
      console.log('Environment check passed ✅');

      // Test storage access
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) {
        console.error('❌ Storage access error:', bucketsError);
        return { 
          canUpload: false, 
          error: `Storage access denied: ${bucketsError.message}. Please check your Supabase configuration and ensure the migration has been applied.` 
        };
      }

      console.log('📦 Available buckets:', buckets?.map(b => b.name));

      const productBucket = buckets?.find(b => b.name === 'product-images');
      if (!productBucket) {
        console.error('❌ Product images bucket not found');
        console.log('Available buckets:', buckets?.map(b => b.name) || 'None');
        return { 
          canUpload: false, 
          error: 'Product images bucket not found. The migration may not have run successfully. Please check your Supabase Dashboard or run the migration manually.' 
        };
      }

      console.log('✅ Product images bucket found:', productBucket);

      // Test if we can list files (read permission)
      const { error: listError } = await supabase.storage
        .from('product-images')
        .list('', { limit: 1 });

      if (listError) {
        console.error('❌ Storage read test failed:', listError);
        return { 
          canUpload: false, 
          error: `Storage read test failed: ${listError.message}. Please check your RLS policies.` 
        };
      }

      console.log('✅ Storage permissions check passed');
      return { canUpload: true, error: null };
    } catch (error) {
      console.error('❌ Storage permission check failed:', error);
      return { 
        canUpload: false, 
        error: error instanceof Error ? error.message : 'Storage permission check failed' 
      };
    }
  };

  return {
    uploading,
    uploadImage,
    uploadMultipleImages,
    checkStoragePermissions,
  };
};