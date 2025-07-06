/*
  # Storage Setup for Product Images - Database Level

  1. Database Functions
    - Add helper functions for storage operations
    - Add validation functions for image uploads

  2. Additional Indexes
    - Add performance indexes for better query performance

  Note: Storage bucket 'product-images' and RLS policies must be created manually 
  in Supabase Dashboard due to permission restrictions in migrations.

  Manual Steps Required in Supabase Dashboard:
  1. Go to Storage > Buckets
  2. Create new bucket named 'product-images'
  3. Set as Public bucket
  4. Set file size limit to 10MB
  5. Set allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, image/gif

  Storage RLS Policies (to be applied manually in Dashboard):
  - Allow authenticated users to upload to product-images bucket
  - Allow public read access to product images
  - Allow authenticated users to update/delete their own images
*/

-- Create a function to validate image uploads
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

-- Create a function to generate unique file names
CREATE OR REPLACE FUNCTION generate_unique_filename(original_name text)
RETURNS text AS $$
DECLARE
  file_ext text;
  unique_name text;
BEGIN
  -- Extract file extension
  file_ext := lower(substring(original_name from '\.([^.]*)$'));
  
  -- Generate unique filename with timestamp and random string
  unique_name := extract(epoch from now())::bigint || '-' || 
                 substr(md5(random()::text), 1, 8) || '.' || file_ext;
  
  RETURN unique_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to clean up orphaned images
CREATE OR REPLACE FUNCTION cleanup_orphaned_images()
RETURNS void AS $$
BEGIN
  -- This function can be used to clean up images that are no longer referenced
  -- Implementation would depend on storage access permissions
  -- For now, this is a placeholder for future use
  RAISE NOTICE 'Cleanup function created - manual implementation required';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions to authenticated users
GRANT EXECUTE ON FUNCTION validate_image_upload(text, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_unique_filename(text) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_images() TO authenticated;

-- Add additional indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_products_images ON products USING gin(images);
CREATE INDEX IF NOT EXISTS idx_products_seller_status ON products(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats(buyer_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at);

-- Create a view for product statistics
CREATE OR REPLACE VIEW product_stats AS
SELECT 
  p.id,
  p.title,
  p.seller_id,
  p.views,
  p.likes,
  p.created_at,
  COALESCE(like_count.count, 0) as actual_likes,
  COALESCE(view_count.count, 0) as actual_views
FROM products p
LEFT JOIN (
  SELECT product_id, COUNT(*) as count
  FROM product_likes
  GROUP BY product_id
) like_count ON p.id = like_count.product_id
LEFT JOIN (
  SELECT id, views as count
  FROM products
) view_count ON p.id = view_count.id;

-- Grant access to the view
GRANT SELECT ON product_stats TO authenticated;

-- Add a trigger to update product likes count
CREATE OR REPLACE FUNCTION update_product_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products 
    SET likes = COALESCE(likes, 0) + 1 
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products 
    SET likes = GREATEST(COALESCE(likes, 0) - 1, 0)
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for like count updates
DROP TRIGGER IF EXISTS trigger_update_likes_on_insert ON product_likes;
DROP TRIGGER IF EXISTS trigger_update_likes_on_delete ON product_likes;

CREATE TRIGGER trigger_update_likes_on_insert
  AFTER INSERT ON product_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_product_likes_count();

CREATE TRIGGER trigger_update_likes_on_delete
  AFTER DELETE ON product_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_product_likes_count();