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

      // Create unique filename with user ID prefix for better organization
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type);
      console.log('User authenticated:', !!user, 'Session valid:', !!session?.access_token);

      // Upload to Supabase Storage with explicit auth headers
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          duplex: 'half'
        });

      if (error) {
        console.error('Storage upload error:', error);
        
        // Handle specific error cases
        if (error.message.includes('row-level security')) {
          throw new Error('Upload permission denied. Please try logging out and back in.');
        } else if (error.message.includes('Bucket not found')) {
          throw new Error('Storage bucket not configured. Please contact support.');
        } else if (error.message.includes('Duplicate')) {
          throw new Error('File already exists. Please try again.');
        } else if (error.message.includes('Unauthorized') || error.message.includes('403')) {
          throw new Error('Upload not authorized. Please check your login status.');
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

  return {
    uploading,
    uploadImage,
    uploadMultipleImages,
  };
};