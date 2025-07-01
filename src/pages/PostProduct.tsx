import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProducts } from '../hooks/useProducts';
import ImageUpload from '../components/ImageUpload';

const PostProduct: React.FC = () => {
  const { user } = useAuth();
  const { createProduct } = useProducts();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    category: 'Electronics',
    condition: 'New',
    price: '',
    currency: 'ETH',
    description: ''
  });
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = ['Electronics', 'Fashion', 'Home & Garden', 'Sports & Outdoors', 'Books & Media', 'Automotive', 'Health & Beauty', 'Toys & Games', 'Other'];
  const conditions = ['New', 'Like New', 'Excellent', 'Good', 'Fair', 'For Parts'];
  const currencies = ['ETH', 'USDT', 'BTC'];

  // Mock crypto prices for conversion
  const cryptoPrices = {
    ETH: 2000,
    BTC: 50000,
    USDT: 1
  };

  const calculateUSDPrice = (price: string, currency: string): number => {
    const numPrice = parseFloat(price) || 0;
    return Math.round(numPrice * cryptoPrices[currency as keyof typeof cryptoPrices]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (images.length === 0) {
      setError('Please add at least one image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const usdPrice = calculateUSDPrice(formData.price, formData.currency);
      
      const { error } = await createProduct({
        title: formData.title,
        brand: formData.brand,
        category: formData.category,
        condition: formData.condition,
        price: parseFloat(formData.price),
        currency: formData.currency,
        usd_price: usdPrice,
        description: formData.description,
        images: images,
        seller_id: user.id,
        status: 'active',
        is_sponsored: false,
      });

      if (error) {
        setError(error);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const estimatedUSD = calculateUSDPrice(formData.price, formData.currency);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">List Your Product</h1>
          <p className="text-gray-600 mt-1">Create a new listing and reach crypto buyers worldwide</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Images */}
          <ImageUpload
            images={images}
            onImagesChange={setImages}
            maxImages={5}
          />

          {/* Basic Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Product Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., MacBook Pro 16-inch M3 Max"
                />
              </div>

              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                  Brand *
                </label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., Apple, Samsung, Nike"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                  Condition *
                </label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {conditions.map(condition => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Pricing
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <div className="flex">
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.0001"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="0.5"
                  />
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="px-4 py-3 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-colors"
                  >
                    {currencies.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated USD Value
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">
                    ${estimatedUSD.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    Based on current {formData.currency} price
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Description
            </h2>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Product Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Describe your product in detail. Include condition, features, specifications, and any other relevant information that buyers should know..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || images.length === 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Listing...</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5" />
                  <span>Create Listing</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostProduct;