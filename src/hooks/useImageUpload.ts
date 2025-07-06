import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File, bucket: string = 'product-images') => {
    try {
      setUploading(true);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image size must be less than 10MB');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = fileName; // Simple flat structure

      console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        
        if (error.message.includes('Bucket not found')) {
          throw new Error('Storage bucket not configured. Please contact support.');
        }
        
        if (error.message.includes('Duplicate')) {
          throw new Error('File already exists. Please try again.');
        }
        
        throw new Error(`Upload failed: ${error.message}`);
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      return { url: publicUrl, error: null };
    } catch (err) {
      console.error('Error uploading image:', err);
      return { 
        url: null, 
        error: err instanceof Error ? err.message : 'Failed to upload image' 
      };
    } finally {
      setUploading(false);
    }
  };

  const uploadMultipleImages = async (files: File[], bucket: string = 'product-images') => {
    console.log('Uploading multiple images:', files.length);
    
    const results = await Promise.all(
      files.map(file => uploadImage(file, bucket))
    );

    const urls = results
      .filter(result => result.url)
      .map(result => result.url!);

    const errors = results
      .filter(result => result.error)
      .map(result => result.error!);

    console.log('Upload results - URLs:', urls.length, 'Errors:', errors.length);

    return { urls, errors };
  };

  return {
    uploading,
    uploadImage,
    uploadMultipleImages,
  };
};