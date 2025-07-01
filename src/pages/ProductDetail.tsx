import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MessageCircle, User, Calendar, Shield, Star, Heart, Eye, Share2, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChats } from '../hooks/useChats';
import { supabase, Product } from '../lib/supabase';
import CryptoConverter from '../components/CryptoConverter';
import UserRating from '../components/UserRating';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createOrGetChat } = useChats();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      setProduct(data);

      // Increment view count
      await supabase.rpc('increment_product_views', { product_id: id });

      // Check if user has liked this product
      if (user) {
        const { data: likeData } = await supabase
          .from('product_likes')
          .select('id')
          .eq('product_id', id)
          .eq('user_id', user.id)
          .single();

        setIsLiked(!!likeData);
      }
    } catch (err) {
      console.error('Error loading product:', err);
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleChatWithSeller = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (product && product.seller_id !== user.id) {
      const chat = await createOrGetChat(product.id, product.seller_id);
      if (chat) {
        navigate(`/chat/${product.seller_id}/${product.id}`);
      }
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!product) return;

    try {
      if (isLiked) {
        // Remove like
        await supabase
          .from('product_likes')
          .delete()
          .eq('product_id', product.id)
          .eq('user_id', user.id);
      } else {
        // Add like
        await supabase
          .from('product_likes')
          .insert({
            product_id: product.id,
            user_id: user.id,
          });
      }

      setIsLiked(!isLiked);
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const nextImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out this ${product.brand} ${product.title} for ${product.price} ${product.currency}!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-500 text-lg">{error || 'Product not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === product.seller_id;

  // Mock seller data for demonstration
  const sellerRating = {
    rating: 4.8,
    totalRatings: 127,
    successfulTrades: 89,
    responseTime: "< 1 hour"
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
            <img
              src={product.images[currentImageIndex] || 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=500&h=300&fit=crop'}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            
            {product.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-opacity"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-opacity"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col space-y-2">
              {product.is_sponsored && (
                <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-3 py-1 rounded-full text-sm font-medium">
                  <Star className="w-4 h-4 fill-current" />
                  <span>Sponsored</span>
                </div>
              )}
              {product.condition && (
                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {product.condition}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <button
                onClick={handleLike}
                className={`p-3 rounded-full backdrop-blur-sm transition-all ${
                  isLiked 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white bg-opacity-80 text-gray-600 hover:bg-opacity-100'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-3 rounded-full bg-white bg-opacity-80 text-gray-600 hover:bg-opacity-100 backdrop-blur-sm transition-all"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="absolute bottom-4 left-4 flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                <Eye className="w-4 h-4" />
                <span>{product.views || 0} views</span>
              </div>
              <div className="flex items-center space-x-1 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                <Heart className="w-4 h-4" />
                <span>{product.likes || 0} likes</span>
              </div>
            </div>
          </div>

          {/* Thumbnail Images */}
          {product.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    currentImageIndex === index 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.title}</h1>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
              <span className="bg-gray-100 px-2 py-1 rounded-full">{product.category}</span>
              <span className="font-medium">{product.brand}</span>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(product.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Price & Converter */}
          <CryptoConverter 
            amount={product.price} 
            fromCurrency={product.currency}
            className="border-2 border-blue-100"
          />

          {/* Seller Info & Rating */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Seller Information</h3>
              <div className="flex items-center space-x-3 mb-3">
                <img
                  src={product.seller?.avatar_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}
                  alt={product.seller?.name || 'Seller'}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-gray-900">{product.seller?.name || 'Unknown Seller'}</div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Shield className="w-4 h-4" />
                    <span>Verified Seller</span>
                  </div>
                </div>
              </div>
            </div>

            <UserRating {...sellerRating} />
          </div>

          {/* Description */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isOwner ? (
              <>
                <button
                  onClick={handleChatWithSeller}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-lg"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Chat with Seller</span>
                </button>
                <button 
                  onClick={handleLike}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                  <span>{isLiked ? 'Remove from Watchlist' : 'Add to Watchlist'}</span>
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-800 font-medium">This is your listing</p>
                  <p className="text-green-600 text-sm mt-1">
                    {product.views || 0} people have viewed your product
                  </p>
                </div>
                
                <button
                  onClick={() => navigate('/account')}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span>Manage Listing</span>
                </button>
              </div>
            )}

            {!user && (
              <div className="text-center text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                <span>Please </span>
                <button
                  onClick={() => navigate('/login')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  log in
                </button>
                <span> to contact the seller and access all features</span>
              </div>
            )}
          </div>

          {/* Safety Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Safety Tips</h4>
                <ul className="text-sm text-blue-800 mt-1 space-y-1">
                  <li>• Meet in public places for physical exchanges</li>
                  <li>• Use escrow services for high-value items</li>
                  <li>• Verify crypto transactions before releasing items</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;