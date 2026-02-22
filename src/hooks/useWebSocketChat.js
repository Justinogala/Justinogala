import { useState, useEffect, useRef, useCallback } from 'react';

const POLL_INTERVAL = 5000; // Poll every 5 seconds for new messages

export const useWebSocketChat = (userId, onMessage, onPresence, onTyping, onReadReceipt) => {
  const [isConnected, setIsConnected] = useState(true); // Always "connected" in REST mode
  const [connectionError, setConnectionError] = useState(null);
  const pollIntervalRef = useRef(null);

  // Start polling for messages (REST API fallback)
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current || !userId) return;
    
    console.log('[Chat] REST API mode active');
    setIsConnected(true);
    setConnectionError(null);
    
    // Poll interval for checking new messages (in real app, would fetch from API)
    pollIntervalRef.current = setInterval(() => {
      // Polling logic would go here
      // For now, messages are fetched on conversation load
    }, POLL_INTERVAL);
  }, [userId]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (userId) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [userId, startPolling, stopPolling]);

  // Send message - always returns false to use REST API
  const sendMessage = useCallback((receiverId, content, messageType = 'text', attachments = []) => {
    // Return false to indicate WebSocket not available, use REST API
    return false;
  }, []);

  // Send typing indicator (no-op in REST mode)
  const sendTypingIndicator = useCallback((receiverId, isTyping) => {
    // Typing indicators not supported in REST mode
  }, []);

  // Send read receipt (no-op in REST mode, handled via REST API)
  const sendReadReceipt = useCallback((messageIds, senderId) => {
    // Read receipts handled via REST API in context
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    stopPolling();
    startPolling();
  }, [startPolling, stopPolling]);

  return {
    isConnected,
    connectionError,
    usePolling: true,
    sendMessage,
    sendTypingIndicator,
    sendReadReceipt,
    reconnect
  };
};

export default useWebSocketChat;
