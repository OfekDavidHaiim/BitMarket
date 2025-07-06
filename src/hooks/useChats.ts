import { useState, useEffect } from 'react';
import { supabase, Chat, Message } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useChats = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChats = async () => {
    if (!user) {
      setChats([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          product:products(*),
          buyer:profiles(*),
          seller:profiles(*),
          messages(
            *,
            sender:profiles(*)
          )
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Add last message to each chat
      const chatsWithLastMessage = (data || []).map(chat => ({
        ...chat,
        last_message: chat.messages && chat.messages.length > 0 
          ? chat.messages[chat.messages.length - 1] 
          : undefined
      }));

      setChats(chatsWithLastMessage);
    } catch (err) {
      console.error('Error loading chats:', err);
      
      // Provide more specific error handling
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch')) {
          setError('Network connection error. Please check your internet connection and try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to load chats. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const createOrGetChat = async (productId: string, sellerId: string) => {
    if (!user) return null;

    try {
      // First, try to find existing chat
      const { data: existingChat, error: findError } = await supabase
        .from('chats')
        .select('*')
        .eq('product_id', productId)
        .eq('buyer_id', user.id)
        .eq('seller_id', sellerId)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      if (existingChat) {
        return existingChat;
      }

      // Create new chat
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({
          product_id: productId,
          buyer_id: user.id,
          seller_id: sellerId,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      await loadChats(); // Reload chats
      return newChat;
    } catch (err) {
      console.error('Error creating/getting chat:', err);
      return null;
    }
  };

  const sendMessage = async (chatId: string, content: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content,
        })
        .select(`
          *,
          sender:profiles(*)
        `)
        .single();

      if (error) {
        throw error;
      }

      // Update chat's updated_at timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);

      // Update local state
      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          const updatedMessages = [...(chat.messages || []), data];
          return {
            ...chat,
            messages: updatedMessages,
            last_message: data,
            updated_at: new Date().toISOString(),
          };
        }
        return chat;
      }));

      return { data, error: null };
    } catch (err) {
      console.error('Error sending message:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Failed to send message' };
    }
  };

  const getChatById = (chatId: string) => {
    return chats.find(chat => chat.id === chatId);
  };

  const getChatMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(*)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error loading messages:', err);
      return { data: [], error: err instanceof Error ? err.message : 'Failed to load messages' };
    }
  };

  useEffect(() => {
    loadChats();
  }, [user]);

  return {
    chats,
    loading,
    error,
    loadChats,
    createOrGetChat,
    sendMessage,
    getChatById,
    getChatMessages,
  };
};