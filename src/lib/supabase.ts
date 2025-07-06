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

// Test connection and storage access
const testConnection = async () => {
  try {
    // Test database connection
    const { error: dbError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (dbError) {
      console.error('Database connection test failed:', dbError);
    } else {
      console.log('Database connection successful');
    }

    // Test storage bucket access
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    if (storageError) {
      console.error('Storage access test failed:', storageError);
    } else {
      console.log('Storage access successful. Available buckets:', buckets?.map(b => b.name));
      
      // Check if product-images bucket exists
      const productImagesBucket = buckets?.find(b => b.name === 'product-images');
      if (productImagesBucket) {
        console.log('Product images bucket found:', productImagesBucket);
      } else {
        console.warn('Product images bucket not found. Please create it in Supabase Dashboard.');
      }
    }
  } catch (error) {
    console.error('Connection test failed:', error);
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