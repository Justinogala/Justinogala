import { useState, useEffect, useRef, useCallback } from 'react';

const POLL_INTERVAL = 2000; // Poll every 2 seconds for better real-time feel
const API_BASE = window.location.origin;

export const useWebSocketChat = (userId, onMessage, onPresence, onTyping, onReadReceipt) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [usePolling, setUsePolling] = useState(true);
  const pollIntervalRef = useRef(null);
  const wsRef = useRef(null);
  const lastMessageTimestampRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;

  // Try to establish WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!userId || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/chat/${userId}`;
      
      console.log('[Chat] Attempting WebSocket connection...');
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('[Chat] WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        setUsePolling(false);
        reconnectAttemptsRef.current = 0;
        stopPolling();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'message':
              onMessage?.(data.payload);
              break;
            case 'presence':
              onPresence?.(data.payload);
              break;
            case 'typing':
              onTyping?.(data.payload);
              break;
            case 'read_receipt':
              onReadReceipt?.(data.payload);
              break;
            default:
              console.log('[Chat] Unknown message type:', data.type);
          }
        } catch (err) {
          console.error('[Chat] Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.warn('[Chat] WebSocket error, falling back to polling:', error);
        setConnectionError('WebSocket connection failed');
      };

      ws.onclose = () => {
        console.log('[Chat] WebSocket closed');
        setIsConnected(false);
        wsRef.current = null;
        
        // Try to reconnect a few times, then fall back to polling
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          setTimeout(connectWebSocket, 2000 * reconnectAttemptsRef.current);
        } else {
          console.log('[Chat] Falling back to REST polling');
          setUsePolling(true);
          startPolling();
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.warn('[Chat] WebSocket not available, using REST polling');
      setUsePolling(true);
      startPolling();
    }
  }, [userId, onMessage, onPresence, onTyping, onReadReceipt]);

  // Start polling for messages (REST API fallback)
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current || !userId) return;
    
    console.log('[Chat] REST API polling mode active');
    setIsConnected(true);
    setConnectionError(null);
    
    const pollMessages = async () => {
      // This is where you'd fetch new messages
      // For now, the context handles message fetching per conversation
    };
    
    pollIntervalRef.current = setInterval(pollMessages, POLL_INTERVAL);
  }, [userId]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Initialize connection on mount
  useEffect(() => {
    if (userId) {
      // Try WebSocket first, fall back to polling
      connectWebSocket();
      
      // If WebSocket fails quickly, start polling as backup
      const fallbackTimer = setTimeout(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          setUsePolling(true);
          setIsConnected(true);
          startPolling();
        }
      }, 3000);
      
      return () => {
        clearTimeout(fallbackTimer);
        stopPolling();
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
      };
    }
  }, [userId, connectWebSocket, startPolling, stopPolling]);

  // Send message via WebSocket (returns false if WS not available)
  const sendMessage = useCallback((receiverId, content, messageType = 'text', attachments = []) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        payload: {
          receiver_id: receiverId,
          content,
          message_type: messageType,
          attachments
        }
      }));
      return true;
    }
    return false; // Use REST API fallback
  }, []);

  // Send typing indicator
  const sendTypingIndicator = useCallback((receiverId, isTyping) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        payload: {
          receiver_id: receiverId,
          is_typing: isTyping
        }
      }));
    }
    // No REST fallback for typing indicators (not critical)
  }, []);

  // Send read receipt
  const sendReadReceipt = useCallback((messageIds, senderId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'read_receipt',
        payload: {
          message_ids: messageIds,
          sender_id: senderId
        }
      }));
    }
    // REST fallback handled in context
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    stopPolling();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    connectWebSocket();
  }, [connectWebSocket, stopPolling]);

  return {
    isConnected,
    connectionError,
    usePolling,
    sendMessage,
    sendTypingIndicator,
    sendReadReceipt,
    reconnect
  };
};

export default useWebSocketChat;
