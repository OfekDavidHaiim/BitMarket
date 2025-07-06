/*
  # Storage Setup for Product Images

  1. Database Functions
    - Add helper functions for product operations
    - Improve error handling for profile operations

  2. Additional Indexes
    - Add performance indexes for better query performance

  Note: Storage bucket 'product-images' must be created manually in Supabase Dashboard
  due to permission restrictions in migrations. After creating the bucket manually,
  the following RLS policies should be applied:

  Storage Policies (to be applied manually):
  - Allow authenticated users to upload images to product-images bucket
  - Allow public read access to product images
  - Allow authenticated users to update/delete their own images
*/

-- Create a function to increment product views safely
CREATE OR REPLACE FUNCTION increment_product_views(product_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET views = COALESCE(views, 0) + 1 
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user profile safely (handles missing profiles)
CREATE OR REPLACE FUNCTION get_user_profile(user_id uuid)
RETURNS TABLE(
  id uuid,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.name, p.avatar_url, p.created_at, p.updated_at
  FROM profiles p
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_seller_status ON products(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats(buyer_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION increment_product_views(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile(uuid) TO authenticated;

-- Add a helper function to validate image uploads
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

GRANT EXECUTE ON FUNCTION validate_image_upload(text, bigint) TO authenticated;