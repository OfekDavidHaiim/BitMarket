import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Plus, MessageCircle, User, LogOut, Search, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CryptoMarket</span>
            </Link>

            <div className="hidden md:flex items-center max-w-md w-full">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          <nav className="flex items-center space-x-4">
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                <span className="text-gray-500">Loading...</span>
              </div>
            ) : user ? (
              <>
                <Link
                  to="/post"
                  className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Sell</span>
                </Link>

                <Link
                  to="/chat"
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <MessageCircle className="w-6 h-6" />
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 p-1 bg-gray-200 rounded-full" />
                    )}
                    <span className="hidden sm:inline text-gray-700">{profile?.name || 'User'}</span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                      <Link
                        to="/account"
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>My Account</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;