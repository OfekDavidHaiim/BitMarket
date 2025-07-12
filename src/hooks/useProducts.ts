import { useState, useEffect } from 'react';
import { supabase, Product } from '../lib/supabase';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📦 Loading products...');

      // Set a timeout for the products query
      const productsPromise = supabase
        .from('products')
        .select(`
          *,
          seller:profiles(*)
        `)
        .eq('status', 'active')
        .order('is_sponsored', { ascending: false })
        .order('created_at', { ascending: false });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Products load timeout')), 5000);
      });

      const { data, error } = await Promise.race([
        productsPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        throw error;
      }

      console.log('✅ Products loaded:', data?.length || 0);
      setProducts(data || []);
    } catch (err) {
      console.error('❌ Error loading products:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
      setError(errorMessage);
      
      // Set empty products array on error to prevent infinite loading
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'views' | 'likes' | 'seller'>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select(`
          *,
          seller:profiles(*)
        `)
        .single();

      if (error) {
        throw error;
      }

      setProducts(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err) {
      console.error('Error creating product:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create product' };
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          seller:profiles(*)
        `)
        .single();

      if (error) {
        throw error;
      }

      setProducts(prev => prev.map(p => p.id === id ? data : p));
      return { data, error: null };
    } catch (err) {
      console.error('Error updating product:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Failed to update product' };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setProducts(prev => prev.filter(p => p.id !== id));
      return { error: null };
    } catch (err) {
      console.error('Error deleting product:', err);
      return { error: err instanceof Error ? err.message : 'Failed to delete product' };
    }
  };

  const incrementViews = async (id: string) => {
    try {
      await supabase.rpc('increment_product_views', { product_id: id });
    } catch (err) {
      console.error('Error incrementing views:', err);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return {
    products,
    loading,
    error,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    incrementViews,
  };
};