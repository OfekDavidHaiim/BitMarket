import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Missing Supabase environment variables!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ MISSING');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ MISSING');
  console.error('');
  console.error('🔧 TO FIX:');
  console.error('1. Create/update your .env file in the project root');
  console.error('2. Add these lines:');
  console.error('   VITE_SUPABASE_URL=your_supabase_project_url');
  console.error('   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.error('3. Get these values from: https://supabase.com/dashboard/project/[your-project]/settings/api');
  console.error('4. Restart your development server');
  console.error('');
}

// Custom fetch function with better error handling for WebContainer environment
const customFetch = async (url: string, options: any = {}) => {
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    console.error('🌐 Network request failed:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your internet connection');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network connection failed - please check your internet connection and Supabase URL');
      }
    }
    
    throw error;
  }
};

// Only create client if we have valid environment variables
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key', 
  {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: customFetch,
    headers: {
      'X-Client-Info': 'crypto-marketplace'
    }
  },
});

// Connection test with better error handling
const testConnection = async () => {
  // Skip test if environment variables are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Skipping connection test - missing environment variables');
    return;
  }

  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Simple connection test with timeout
    const { error: dbError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (dbError) {
      if (dbError.message.includes('Failed to fetch') || dbError.message.includes('Network')) {
        console.error('❌ Network connection failed - check your Supabase URL and internet connection');
        console.error('Current URL:', supabaseUrl);
        console.error('💡 This might be a temporary network issue. Try refreshing the page.');
      } else {
        console.error('❌ Database connection test failed:', dbError.message);
      }
    } else {
      console.log('✅ Database connection successful');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network') || errorMessage.includes('timeout')) {
      console.error('❌ Network error: Cannot reach Supabase servers');
      console.error('🔧 Check:');
      console.error('  - Your internet connection');
      console.error('  - Your Supabase URL is correct');
      console.error('  - Your Supabase project is active');
      console.error('  - Try refreshing the page');
    } else {
      console.error('❌ Connection test failed:', errorMessage);
    }
  }
};

// Run connection test only if we have environment variables
if (supabaseUrl && supabaseAnonKey) {
  testConnection();
}

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