/*
  # Initial Schema for CryptoMarket

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `email` (text)
      - `name` (text)
      - `avatar_url` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `products`
      - `id` (uuid, primary key)
      - `title` (text)
      - `brand` (text)
      - `category` (text)
      - `condition` (text)
      - `price` (numeric)
      - `currency` (text)
      - `usd_price` (numeric)
      - `description` (text)
      - `images` (text array)
      - `status` (text, default 'active')
      - `is_sponsored` (boolean, default false)
      - `sponsored_until` (timestamp, optional)
      - `seller_id` (uuid, references profiles)
      - `views` (integer, default 0)
      - `likes` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `chats`
      - `id` (uuid, primary key)
      - `product_id` (uuid, references products)
      - `buyer_id` (uuid, references profiles)
      - `seller_id` (uuid, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `messages`
      - `id` (uuid, primary key)
      - `chat_id` (uuid, references chats)
      - `sender_id` (uuid, references profiles)
      - `content` (text)
      - `created_at` (timestamp)
    
    - `product_likes`
      - `id` (uuid, primary key)
      - `product_id` (uuid, references products)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access where appropriate
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  brand text NOT NULL,
  category text NOT NULL,
  condition text NOT NULL,
  price numeric NOT NULL,
  currency text NOT NULL,
  usd_price numeric NOT NULL,
  description text NOT NULL,
  images text[] DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'sold')),
  is_sponsored boolean DEFAULT false,
  sponsored_until timestamptz,
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, buyer_id, seller_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create product_likes table
CREATE TABLE IF NOT EXISTS product_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_likes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Products policies
CREATE POLICY "Anyone can read active products"
  ON products
  FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Users can read own products"
  ON products
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Users can insert own products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Users can update own products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Users can delete own products"
  ON products
  FOR DELETE
  TO authenticated
  USING (seller_id = auth.uid());

-- Chats policies
CREATE POLICY "Users can read own chats"
  ON chats
  FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can create chats"
  ON chats
  FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can read messages from own chats"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = messages.chat_id 
      AND (chats.buyer_id = auth.uid() OR chats.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages to own chats"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = messages.chat_id 
      AND (chats.buyer_id = auth.uid() OR chats.seller_id = auth.uid())
    )
  );

-- Product likes policies
CREATE POLICY "Users can read all product likes"
  ON product_likes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own likes"
  ON product_likes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_sponsored ON products(is_sponsored);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_buyer_id ON chats(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chats_seller_id ON chats(seller_id);
CREATE INDEX IF NOT EXISTS idx_chats_product_id ON chats(product_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_product_likes_product_id ON product_likes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_likes_user_id ON product_likes(user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();