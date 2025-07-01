import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Package, Paperclip, Smile, MoreVertical, Phone, Video, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChats } from '../hooks/useChats';
import { supabase, Product } from '../lib/supabase';

const ChatPage: React.FC = () => {
  const { sellerId, productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { chats, createOrGetChat, sendMessage, getChatMessages } = useChats();
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      initializeChat();
    }
  }, [user, sellerId, productId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeChat = async () => {
    try {
      setLoading(true);

      if (sellerId && productId) {
        // Create or get specific chat
        const chat = await createOrGetChat(productId, sellerId);
        if (chat) {
          setCurrentChat(chat);
          await loadChatMessages(chat.id);
        }

        // Load product info
        const { data: productData } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (productData) {
          setProduct(productData);
        }
      } else if (chats.length > 0) {
        // Show first chat if no specific chat selected
        const firstChat = chats[0];
        setCurrentChat(firstChat);
        await loadChatMessages(firstChat.id);

        // Load product for first chat
        const { data: productData } = await supabase
          .from('products')
          .select('*')
          .eq('id', firstChat.product_id)
          .single();

        if (productData) {
          setProduct(productData);
        }
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async (chatId: string) => {
    try {
      const { data, error } = await getChatMessages(chatId);
      if (error) {
        console.error('Error loading messages:', error);
      } else {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentChat || sending) return;

    setSending(true);
    try {
      const { data, error } = await sendMessage(currentChat.id, message.trim());
      if (error) {
        console.error('Error sending message:', error);
      } else if (data) {
        setMessages(prev => [...prev, data]);
        setMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleChatSelect = async (chat: any) => {
    setCurrentChat(chat);
    await loadChatMessages(chat.id);

    // Load product for selected chat
    const { data: productData } = await supabase
      .from('products')
      .select('*')
      .eq('id', chat.product_id)
      .single();

    if (productData) {
      setProduct(productData);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
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
            <p className="text-gray-600">Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups: any[], message) => {
    const date = formatDate(message.created_at);
    const lastGroup = groups[groups.length - 1];
    
    if (lastGroup && lastGroup.date === date) {
      lastGroup.messages.push(message);
    } else {
      groups.push({ date, messages: [message] });
    }
    
    return groups;
  }, []);

  const isOwner = product && user.id === product.seller_id;
  const chatPartnerName = isOwner ? 'Buyer' : (product?.seller?.name || 'Seller');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-12rem)] flex">
        {/* Chat List Sidebar */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {chats.length > 0 ? (
              <div className="space-y-1 p-2">
                {chats.map(chat => {
                  const isSelected = currentChat?.id === chat.id;
                  
                  return (
                    <button
                      key={chat.id}
                      onClick={() => handleChatSelect(chat)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {chat.product?.title || 'Product Chat'}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {chat.last_message?.content || 'No messages yet'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {chat.last_message && formatTime(chat.last_message.created_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No conversations yet</p>
                  <p className="text-sm text-gray-400">Start chatting with sellers</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {currentChat && product ? (
            <>
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <Package className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold">{chatPartnerName}</h2>
                      <p className="text-blue-100 text-sm truncate">{product.title}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {product.price} {product.currency}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors">
                      <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 border-b border-gray-200 p-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={product.images[0] || 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=500&h=300&fit=crop'}
                    alt={product.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{product.title}</h3>
                    <p className="text-sm text-blue-600 font-semibold">
                      {product.price} {product.currency}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                  >
                    View Product
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {groupedMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg">Start the conversation!</p>
                    <p className="text-sm">Send a message to {chatPartnerName}</p>
                  </div>
                ) : (
                  groupedMessages.map((group, groupIndex) => (
                    <div key={groupIndex}>
                      {/* Date separator */}
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                          {group.date}
                        </div>
                      </div>
                      
                      {/* Messages for this date */}
                      {group.messages.map((msg: any) => {
                        const isOwn = msg.sender_id === user.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                                isOwn
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="leading-relaxed">{msg.content}</p>
                              <p
                                className={`text-xs mt-2 ${
                                  isOwn ? 'text-blue-100' : 'text-gray-500'
                                }`}
                              >
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex items-end space-x-3">
                  <button
                    type="button"
                    className="p-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                        disabled={sending}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!message.trim() || sending}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-full hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 flex items-center justify-center"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Select a conversation</p>
                <p className="text-gray-400">Choose a chat from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;