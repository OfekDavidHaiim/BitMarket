import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'crypto-marketplace'
    }
  }
});

// Enhanced connection and storage testing
const testConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test database connection
    const { error: dbError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (dbError) {
      console.error('❌ Database connection test failed:', dbError);
    } else {
      console.log('✅ Database connection successful');
    }

    // Test storage bucket access
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    if (storageError) {
      console.error('❌ Storage access test failed:', storageError);
    } else {
      console.log('✅ Storage access successful. Available buckets:', buckets?.map(b => b.name));
      
      // Check if product-images bucket exists
      const productImagesBucket = buckets?.find(b => b.name === 'product-images');
      if (productImagesBucket) {
        console.log('✅ Product images bucket found:', {
          name: productImagesBucket.name,
          public: productImagesBucket.public,
          fileSizeLimit: productImagesBucket.file_size_limit,
          allowedMimeTypes: productImagesBucket.allowed_mime_types
        });

        // Test storage policies by trying to list files
        const { data: files, error: listError } = await supabase.storage
          .from('product-images')
          .list('', { limit: 1 });

        if (listError) {
          console.warn('⚠️ Storage list test failed (may be normal for empty bucket):', listError.message);
        } else {
          console.log('✅ Storage list test successful. Files found:', files?.length || 0);
        }
      } else {
        console.warn('⚠️ Product images bucket not found. Please create it in Supabase Dashboard.');
        console.log('📋 To create the bucket:');
        console.log('   1. Go to Supabase Dashboard > Storage');
        console.log('   2. Create new bucket named "product-images"');
        console.log('   3. Set as Public bucket');
        console.log('   4. Set file size limit to 10MB');
        console.log('   5. Set allowed MIME types: image/jpeg, image/png, image/webp, image/gif');
      }
    }

    // Test storage permissions if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      console.log('🔐 User authenticated, testing storage permissions...');
      
      try {
        // Test if we can check storage permissions
        const { data: permissionCheck, error: permError } = await supabase
          .rpc('check_storage_permissions');
        
        if (permError) {
          console.warn('⚠️ Storage permission check function not available:', permError.message);
        } else if (permissionCheck && permissionCheck.length > 0) {
          const perms = permissionCheck[0];
          console.log('📊 Storage permissions:', {
            canUpload: perms.can_upload,
            canRead: perms.can_read,
            bucketExists: perms.bucket_exists,
            errorMessage: perms.error_message
          });
        }
      } catch (error) {
        console.log('ℹ️ Storage permission check not available (normal for new setups)');
      }
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
};

// Run connection test
testConnection();

// Database types
export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  title: string;
  brand: string;
  category: string;
  condition: string;
  price: number;
  currency: string;
  usd_price: number;
  description: string;
  images: string[];
  status: 'active' | 'sold';
  is_sponsored: boolean;
  sponsored_until?: string;
  seller_id: string;
  views: number;
  likes: number;
  created_at: string;
  updated_at: string;
  // Joined data
  seller?: Profile;
}

export interface Chat {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  // Joined data
  product?: Product;
  buyer?: Profile;
  seller?: Profile;
  messages?: Message[];
  last_message?: Message;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  // Joined data
  sender?: Profile;
}

export interface ProductLike {
  id: string;
  product_id: string;
  user_id: string;
  created_at: string;
}