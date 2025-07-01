import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File, bucket: string = 'product-images') => {
    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

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
    const results = await Promise.all(
      files.map(file => uploadImage(file, bucket))
    );

    const urls = results
      .filter(result => result.url)
      .map(result => result.url!);

    const errors = results
      .filter(result => result.error)
      .map(result => result.error!);

    return { urls, errors };
  };

  return {
    uploading,
    uploadImage,
    uploadMultipleImages,
  };
};