import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, Eye, Clock } from 'lucide-react';
import { Product } from '../lib/supabase';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const formatPrice = (price: number, currency: string) => {
    if (currency === 'USDT') {
      return `${price} USDT`;
    }
    return `${price} ${currency}`;
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
        {/* Product Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={product.images[0] || 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=500&h=300&fit=crop'}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col space-y-2">
            {product.is_sponsored && (
              <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-2 py-1 rounded-full text-xs font-medium shadow-sm">
                <Star className="w-3 h-3 fill-current" />
                <span>Sponsored</span>
              </div>
            )}
            {product.condition && (
              <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                {product.condition}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="absolute bottom-3 right-3 flex items-center space-x-2">
            {product.views > 0 && (
              <div className="flex items-center space-x-1 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
                <Eye className="w-3 h-3" />
                <span>{product.views}</span>
              </div>
            )}
            {product.likes > 0 && (
              <div className="flex items-center space-x-1 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
                <Heart className="w-3 h-3" />
                <span>{product.likes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.title}
          </h3>
          
          <div className="mb-3">
            <div className="text-xl font-bold text-gray-900">
              {formatPrice(product.price, product.currency)}
            </div>
            <div className="text-sm text-gray-500">
              ≈ ${product.usd_price.toLocaleString()}
            </div>
          </div>

          {/* Seller Info */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <img
                src={product.seller?.avatar_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}
                alt={product.seller?.name || 'Seller'}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-sm text-gray-600 truncate">{product.seller?.name || 'Unknown Seller'}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{timeAgo(product.created_at)}</span>
            </div>
          </div>

          {/* Category & Brand */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="bg-gray-100 px-2 py-1 rounded-full">{product.category}</span>
            <span className="font-medium">{product.brand}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;