import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Marketplace from './pages/Marketplace';
import ProductDetail from './pages/ProductDetail';
import UserAccount from './pages/UserAccount';
import PostProduct from './pages/PostProduct';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading CryptoMarket...</h2>
          <p className="text-gray-600 mb-4">Setting up your marketplace experience</p>
          
          {/* Progress indicator */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          
          <div className="text-sm text-gray-500 space-y-1">
            <p>• Connecting to database...</p>
            <p>• Checking authentication...</p>
            <p>• Loading user profile...</p>
          </div>
          
          {/* Fallback message */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Taking longer than expected? 
              <button 
                onClick={() => window.location.reload()} 
                className="ml-2 text-yellow-900 underline hover:no-underline"
              >
                Try refreshing the page
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<Marketplace />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          {user && (
            <>
              <Route path="/account" element={<UserAccount />} />
              <Route path="/post" element={<PostProduct />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/chat/:sellerId/:productId" element={<ChatPage />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}

export default App;