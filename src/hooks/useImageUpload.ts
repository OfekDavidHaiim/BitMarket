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

      // First, check if the bucket exists and create it if it doesn't
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
      }

      const bucketExists = buckets?.some(b => b.name === bucket);
      
      if (!bucketExists) {
        console.error(`Storage bucket '${bucket}' not found. Please create it in your Supabase dashboard.`);
        throw new Error(`Storage bucket '${bucket}' not found. Please create the bucket in your Supabase dashboard and configure appropriate policies.`);
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) {
        if (error.message.includes('Bucket not found')) {
          throw new Error(`Storage bucket '${bucket}' not found. Please create the bucket in your Supabase dashboard and configure appropriate policies.`);
        }
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