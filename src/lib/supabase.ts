import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

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