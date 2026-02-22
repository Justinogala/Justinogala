
import { useState, useEffect, useCallback } from 'react';
import { messagingService } from '@/services/messagingService';
import { useAuth } from '@/context/AuthContext';

export const useMessaging = (conversationId = null) => {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    const data = await messagingService.getMessages(conversationId);
    setMessages(data);
  }, [conversationId]);

  const fetchConversations = useCallback(async (isAdmin = false) => {
    if (!user && !isAdmin) return;
    setLoading(true);
    try {
      // Assuming admin check is passed or handled elsewhere, or passed as arg
      const data = await messagingService.getConversations(user?.id, isAdmin);
      setConversations(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [conversationId, fetchMessages]);

  const sendMessage = async (content, senderType = 'user') => {
    if (!conversationId || !user) return;
    await messagingService.sendMessage({
      conversation_id: conversationId,
      sender_id: user.id,
      sender_type: senderType,
      content,
      sender_name: user.name || user.email
    });
    await fetchMessages();
  };

  return {
    messages,
    conversations,
    loading,
    fetchConversations,
    sendMessage,
    refreshMessages: fetchMessages
  };
};
