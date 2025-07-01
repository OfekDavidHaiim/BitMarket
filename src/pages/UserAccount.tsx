import React, { useState, useEffect } from 'react';
import { Package, MessageCircle, ShoppingBag, Settings, Star, Calendar, TrendingUp, Eye, Heart, CheckCircle, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChats } from '../hooks/useChats';
import { useNavigate } from 'react-router-dom';
import { supabase, Product } from '../lib/supabase';
import ProductCard from '../components/ProductCard';

const UserAccount: React.FC = () => {
  const { user, profile } = useAuth();
  const { chats } = useChats();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [soldProducts, setSoldProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserProducts();
    }
  }, [user]);

  const loadUserProducts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles(*)
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const active = data?.filter(p => p.status === 'active') || [];
      const sold = data?.filter(p => p.status === 'sold') || [];
      
      setUserProducts(active);
      setSoldProducts(sold);
    } catch (error) {
      console.error('Error loading user products:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsSold = async (productId: string) => {
    try {
      setActionLoading(productId);

      const { error } = await supabase
        .from('products')
        .update({ status: 'sold' })
        .eq('id', productId);

      if (error) {
        throw error;
      }

      await loadUserProducts();
    } catch (error) {
      console.error('Error marking product as sold:', error);
      alert('Failed to mark product as sold');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(productId);

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        throw error;
      }

      await loadUserProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading account...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalViews = userProducts.reduce((sum, product) => sum + (product.views || 0), 0);
  const totalLikes = userProducts.reduce((sum, product) => sum + (product.likes || 0), 0);
  const totalRevenue = soldProducts.reduce((sum, product) => sum + product.usd_price, 0);
  const sponsoredCount = userProducts.filter(p => p.is_sponsored).length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'listings', label: 'My Listings', icon: Package, count: userProducts.length },
    { id: 'sold', label: 'Sold Items', icon: ShoppingBag, count: soldProducts.length },
    { id: 'chats', label: 'Messages', icon: MessageCircle, count: chats.length }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Enhanced Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-xl shadow-sm p-8 mb-8 text-white">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src={profile?.avatar_url || 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}
              alt={profile?.name || 'User'}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{profile?.name || 'User'}</h1>
            <p className="text-blue-100 text-lg">{profile?.email || user.email}</p>
            <div className="flex items-center space-x-6 mt-3 text-sm">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(profile?.created_at || user.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 fill-current text-yellow-300" />
                <span>Verified Seller</span>
              </div>
              <div className="flex items-center space-x-1">
                <Package className="w-4 h-4" />
                <span>{userProducts.length + soldProducts.length} Total Listings</span>
              </div>
            </div>
          </div>
          <button className="flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors">
            <Settings className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{userProducts.length}</div>
                <div className="text-gray-600">Active Listings</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{soldProducts.length}</div>
                <div className="text-gray-600">Items Sold</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</div>
                <div className="text-gray-600">Total Views</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{sponsoredCount}</div>
                <div className="text-gray-600">Sponsored Ads</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-lg font-semibold text-blue-900">
                      ${totalRevenue.toLocaleString()}
                    </div>
                    <div className="text-blue-700">Total Revenue (USD)</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-lg font-semibold text-green-900">
                      {((soldProducts.length / (userProducts.length + soldProducts.length)) * 100 || 0).toFixed(1)}%
                    </div>
                    <div className="text-green-700">Conversion Rate</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-lg font-semibold text-purple-900">
                      {totalViews > 0 && userProducts.length > 0 ? (totalViews / userProducts.length).toFixed(0) : 0}
                    </div>
                    <div className="text-purple-700">Avg. Views per Listing</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate('/post')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Create New Listing</div>
                        <div className="text-sm text-gray-500">Post a new product for sale</div>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate('/chat')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">View Messages</div>
                        <div className="text-sm text-gray-500">Check your conversations</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* My Listings */}
          {activeTab === 'listings' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Active Listings</h2>
                <div className="flex items-center space-x-4">
                  <p className="text-gray-500">{userProducts.length} active listings</p>
                  <button
                    onClick={() => navigate('/post')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add New Listing
                  </button>
                </div>
              </div>
              
              {userProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {userProducts.map(product => (
                    <div key={product.id} className="relative">
                      <ProductCard product={product} />
                      
                      {/* Action Buttons */}
                      <div className="mt-3 space-y-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => markAsSold(product.id)}
                            disabled={actionLoading === product.id}
                            className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                          >
                            {actionLoading === product.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            <span>Mark Sold</span>
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            disabled={actionLoading === product.id}
                            className="px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No active listings</p>
                  <p className="text-gray-400 mb-4">Start selling by creating your first listing</p>
                  <button
                    onClick={() => navigate('/post')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Listing
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sold Items */}
          {activeTab === 'sold' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Sold Items</h2>
                <p className="text-gray-500">{soldProducts.length} items sold</p>
              </div>
              
              {soldProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {soldProducts.map(product => (
                    <div key={product.id} className="relative">
                      <div className="opacity-75">
                        <ProductCard product={product} />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-10 rounded-xl flex items-center justify-center">
                        <span className="bg-green-500 text-white px-4 py-2 rounded-full font-medium shadow-lg flex items-center space-x-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>SOLD</span>
                        </span>
                      </div>
                      <div className="mt-3">
                        <button
                          onClick={() => deleteProduct(product.id)}
                          disabled={actionLoading === product.id}
                          className="w-full px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                        >
                          {actionLoading === product.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          <span>Remove from History</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No sold items</p>
                  <p className="text-gray-400">Items you mark as sold will appear here</p>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {activeTab === 'chats' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
                <p className="text-gray-500">{chats.length} conversations</p>
              </div>
              
              {chats.length > 0 ? (
                <div className="space-y-4">
                  {chats.map(chat => (
                    <button
                      key={chat.id}
                      onClick={() => navigate(`/chat/${chat.seller_id}/${chat.product_id}`)}
                      className="w-full bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                          <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {chat.product?.title ? `Chat about "${chat.product.title}"` : 'Product Chat'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {chat.last_message?.content ? chat.last_message.content.substring(0, 50) + '...' : 'No messages yet'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {chat.last_message && new Date(chat.last_message.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {chat.last_message && (
                          <div className="text-right">
                            <div className="text-xs text-gray-500">
                              {new Date(chat.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No messages</p>
                  <p className="text-gray-400">Start chatting with buyers and sellers</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAccount;