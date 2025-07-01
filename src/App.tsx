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
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CryptoMarket...</p>
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