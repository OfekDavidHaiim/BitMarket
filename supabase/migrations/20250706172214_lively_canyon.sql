/*
  # Fix Storage and Upload Issues

  1. Storage Bucket Setup
    - The storage bucket 'product-images' needs to be created manually in the Supabase dashboard
    - This migration focuses on database-level fixes

  2. Database Functions
    - Add helper functions for product operations
    - Improve error handling for profile operations

  3. Additional Indexes
    - Add performance indexes for better query performance
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