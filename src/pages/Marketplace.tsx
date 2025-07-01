import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, Filter, Grid3X3, List, Loader2 } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import { useProducts } from '../hooks/useProducts';
import { Product } from '../lib/supabase';

interface SearchFilters {
  category: string;
  minPrice: string;
  maxPrice: string;
  currency: string;
  sortBy: string;
}

const Marketplace: React.FC = () => {
  const { products, loading, error } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  const handleSearch = (query: string, filters: SearchFilters) => {
    let filtered = [...products];

    // Apply text search
    if (query.trim()) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.brand.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply filters
    if (filters.category !== 'all') {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    if (filters.currency !== 'all') {
      filtered = filtered.filter(product => product.currency === filters.currency);
    }

    if (filters.minPrice) {
      filtered = filtered.filter(product => product.usd_price >= parseFloat(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(product => product.usd_price <= parseFloat(filters.maxPrice));
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.usd_price - b.usd_price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.usd_price - a.usd_price);
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      default: // newest
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredProducts(filtered);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading marketplace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">Error loading products: {error}</p>
        </div>
      </div>
    );
  }

  const sponsoredProducts = filteredProducts.filter(product => product.is_sponsored);
  const regularProducts = filteredProducts.filter(product => !product.is_sponsored);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600 rounded-xl p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-3">Trade with Cryptocurrency</h1>
          <p className="text-blue-100 text-lg mb-4">
            Discover amazing products and trade securely with ETH, USDT, BTC and more
          </p>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>{products.length} Active Listings</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span>Live Crypto Prices</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>Secure Trading</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} className="mb-8" />

      {/* View Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {filteredProducts.length} Products Found
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sponsored Products */}
      {sponsoredProducts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-6">
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
            <h2 className="text-xl font-semibold text-gray-900">Sponsored Listings</h2>
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
              Premium
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sponsoredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Regular Products */}
      <div>
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Marketplace</h2>
        </div>
        
        {regularProducts.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }>
            {regularProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg mb-2">No products found</p>
              <p className="text-gray-400">Try adjusting your search filters or check back later for new listings.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;