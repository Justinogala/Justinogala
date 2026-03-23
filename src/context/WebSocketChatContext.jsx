import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWebSocketChat } from '@/hooks/useWebSocketChat';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useToast } from '@/components/ui/use-toast';

const WebSocketChatContext = createContext(null);

export const WebSocketChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  const { toast } = useToast();
  const [messages, setMessages] = useState({});  // {conversationId: [messages]}
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});  // {conversationId: userId}
  const [unreadCounts, setUnreadCounts] = useState({});  // {conversationId: count}

  // Get conversation ID for two users
  const getConversationId = useCallback((userId1, userId2) => {
    return [userId1, userId2].sort().join('_');
  }, []);

  // Handle new message from SSE
  const handleMessage = useCallback((messageData) => {
    const convId = getConversationId(messageData.sender_id, messageData.receiver_id);
    
    setMessages(prev => {
      const convMessages = prev[convId] || [];
      
      // Check if this is a confirmation of our sent message (avoid duplicates)
      const existingIndex = convMessages.findIndex(m => 
        m.id === messageData.id || 
        (m.sending && m.content === messageData.content && m.sender_id === messageData.sender_id)
      );
      
      if (existingIndex >= 0) {
        // Update existing message (remove sending state)
        const updated = [...convMessages];
        updated[existingIndex] = { ...messageData, sending: false };
        return { ...prev, [convId]: updated };
      }
      
      // New message from someone else
      return {
        ...prev,
        [convId]: [...convMessages, { ...messageData, sending: false }]
      };
    });

    // Update unread count if message is from someone else
    if (user && messageData.sender_id !== user.id) {
      setUnreadCounts(prev => ({
        ...prev,
        [convId]: (prev[convId] || 0) + 1
      }));
    }
  }, [user, getConversationId]);

  // Handle presence updates
  const handlePresence = useCallback((data) => {
    // Update online users based on presence status
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      // "offline" and "appear_offline" mean not visible online
      if (data.status === 'offline' || data.status === 'appear_offline') {
        newSet.delete(data.user_id);
      } else {
        // "online", "available", "busy", "be_right_back", "away", "do_not_disturb" are all online
        newSet.add(data.user_id);
      }
      return newSet;
    });
  }, []);

  // Handle typing indicators
  const handleTyping = useCallback((data) => {
    setTypingUsers(prev => {
      if (data.is_typing) {
        return { ...prev, [data.conversation_id]: data.user_id };
      } else {
        const newTyping = { ...prev };
        delete newTyping[data.conversation_id];
        return newTyping;
      }
    });

    // Clear typing after 3 seconds (in case we miss the stop event)
    setTimeout(() => {
      setTypingUsers(prev => {
        const newTyping = { ...prev };
        if (newTyping[data.conversation_id] === data.user_id) {
          delete newTyping[data.conversation_id];
        }
        return newTyping;
      });
    }, 3000);
  }, []);

  // Handle read receipts
  const handleReadReceipt = useCallback((data) => {
    const { message_ids, read_by } = data;
    
    // Update message read status
    setMessages(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(convId => {
        updated[convId] = updated[convId].map(msg => 
          message_ids.includes(msg.id) ? { ...msg, is_read: true } : msg
        );
      });
      return updated;
    });
  }, []);

  // Handle critical incident SSE notification
  const handleCriticalIncident = useCallback((data) => {
    const isSOR = data.report_type === 'SOR';
    const title = isSOR ? 'Serious Occurrence Reported' : 'Critical Incident Alert';

    createNotification({
      type: 'incident',
      title,
      message: `${data.report_number} — ${data.severity_label} at ${data.location}. Submitted by ${data.submitted_by_name || 'Unknown'}.`,
      actionUrl: '/reports',
      icon: 'AlertTriangle',
      color: isSOR ? 'bg-red-600' : 'bg-orange-500',
    });

    toast({
      variant: 'destructive',
      title,
      description: `${data.report_number} — ${data.severity_label} ${data.incident_type} at ${data.location}`,
    });
  }, [createNotification, toast]);

  // Initialize WebSocket/SSE connection
  const {
    isConnected,
    connectionError,
    connectionType,
    sendTypingIndicator,
    sendReadReceipt,
    reconnect
  } = useWebSocketChat(
    user?.id,
    handleMessage,
    handlePresence,
    handleTyping,
    handleReadReceipt,
    handleCriticalIncident
  );

  // Fetch initial online users
  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        // Use current location as base URL for API calls
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/chat/online-users`);
        if (response.ok) {
          const data = await response.json();
          setOnlineUsers(new Set(data.online_users));
        }
      } catch (err) {
        console.error('Error fetching online users:', err);
      }
    };

    if (user) {
      fetchOnlineUsers();
    }
  }, [user]);

  // Send message wrapper
  const sendMessage = useCallback(async (receiverId, content, messageType = 'text', attachments = []) => {
    if (!user) return false;

    const convId = getConversationId(user.id, receiverId);
    const tempId = `temp_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    // Optimistically add message to state immediately
    const optimisticMessage = {
      id: tempId,
      sender_id: user.id,
      receiver_id: receiverId,
      content,
      message_type: messageType,
      attachments,
      is_read: false,
      created_at: timestamp,
      timestamp,
      sending: true
    };
    
    setMessages(prev => ({
      ...prev,
      [convId]: [...(prev[convId] || []), optimisticMessage]
    }));

    // Send via REST API (SSE will receive the confirmation)
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_id: receiverId,
          content,
          message_type: messageType,
          attachments
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Replace temp message with real one
        setMessages(prev => ({
          ...prev,
          [convId]: prev[convId].map(msg => 
            msg.id === tempId 
              ? { ...optimisticMessage, id: data.id, created_at: data.created_at, sending: false }
              : msg
          )
        }));
        return true;
      } else {
        // Remove failed message
        setMessages(prev => ({
          ...prev,
          [convId]: prev[convId].filter(msg => msg.id !== tempId)
        }));
        return false;
      }
    } catch (err) {
      console.error('Error sending message via REST:', err);
      // Remove failed message
      setMessages(prev => ({
        ...prev,
        [convId]: prev[convId].filter(msg => msg.id !== tempId)
      }));
      return false;
    }
  }, [user, getConversationId]);

  // Load conversation history
  const loadConversationHistory = useCallback(async (partnerId) => {
    if (!user) return [];
    
    const convId = getConversationId(user.id, partnerId);
    
    // If we already have messages, return them
    if (messages[convId]?.length > 0) {
      return messages[convId];
    }

    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/chat/messages/${user.id}/${partnerId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => ({
          ...prev,
          [convId]: data.messages
        }));
        return data.messages;
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
    }
    return [];
  }, [user, messages, getConversationId]);

  // Mark messages as read
  const markAsRead = useCallback(async (messageIds, senderId) => {
    if (!user || messageIds.length === 0) return;
    
    // Send read receipt via WebSocket
    sendReadReceipt(messageIds, senderId);
    
    // Clear unread count for this conversation
    const convId = getConversationId(user.id, senderId);
    setUnreadCounts(prev => ({
      ...prev,
      [convId]: 0
    }));
  }, [user, sendReadReceipt, getConversationId]);

  // Get messages for a conversation
  const getConversationMessages = useCallback((partnerId) => {
    if (!user) return [];
    const convId = getConversationId(user.id, partnerId);
    return messages[convId] || [];
  }, [user, messages, getConversationId]);

  // Check if user is typing
  const isUserTyping = useCallback((partnerId) => {
    if (!user) return false;
    const convId = getConversationId(user.id, partnerId);
    return typingUsers[convId] === partnerId;
  }, [user, typingUsers, getConversationId]);

  // Check if user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  const value = {
    // Connection state
    isConnected,
    connectionError,
    connectionType,
    reconnect,
    
    // Users
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,
    
    // Messages
    messages, // Expose raw messages for direct subscription
    sendMessage,
    getConversationMessages,
    loadConversationHistory,
    markAsRead,
    getConversationId,
    
    // Typing
    sendTypingIndicator,
    isUserTyping,
    typingUsers,
    
    // Unread
    unreadCounts
  };

  return (
    <WebSocketChatContext.Provider value={value}>
      {children}
    </WebSocketChatContext.Provider>
  );
};

export const useWebSocketChatContext = () => {
  const context = useContext(WebSocketChatContext);
  if (!context) {
    throw new Error('useWebSocketChatContext must be used within a WebSocketChatProvider');
  }
  return context;
};

export default WebSocketChatContext;
