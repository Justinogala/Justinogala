import { useState, useEffect, useRef, useCallback } from 'react';

const WS_RECONNECT_DELAY = 3000;
const WS_PING_INTERVAL = 30000;
const POLL_INTERVAL = 3000; // Polling fallback interval

export const useWebSocketChat = (userId, onMessage, onPresence, onTyping, onReadReceipt) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [usePolling, setUsePolling] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const lastMessageTimestampRef = useRef(null);
  const maxReconnectAttempts = 3; // Reduced for faster fallback to polling

  // Get WebSocket URL from environment
  const getWsUrl = useCallback(() => {
    // Use the same host as the current page
    const wsHost = window.location.host;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${wsProtocol}://${wsHost}/ws/chat/${userId}`;
  }, [userId]);

  // Polling fallback
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return; // Already polling
    
    console.log('[Chat] Starting polling fallback');
    setUsePolling(true);
    setIsConnected(true); // Consider connected via polling
    setConnectionError(null);
    
    const poll = async () => {
      // In a real implementation, this would fetch new messages since lastTimestamp
      // For now, we just mark as connected
    };
    
    poll();
    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setUsePolling(false);
  }, []);

  const connect = useCallback(() => {
    if (!userId) return;
    
    try {
      const wsUrl = getWsUrl();
      console.log('[WebSocket] Connecting to:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, WS_PING_INTERVAL);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocket] Message received:', data.type);

          switch (data.type) {
            case 'new_message':
              onMessage?.(data.data);
              break;
            case 'presence':
              onPresence?.(data);
              break;
            case 'typing':
              onTyping?.(data);
              break;
            case 'read_receipt':
              onReadReceipt?.(data);
              break;
            case 'pong':
              // Keep-alive response, no action needed
              break;
            default:
              console.log('[WebSocket] Unknown message type:', data.type);
          }
        } catch (err) {
          console.error('[WebSocket] Error parsing message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setConnectionError('Connection error');
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect if not a clean close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`[WebSocket] Reconnecting... Attempt ${reconnectAttemptsRef.current}`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, WS_RECONNECT_DELAY * reconnectAttemptsRef.current);
        }
      };
    } catch (err) {
      console.error('[WebSocket] Connection error:', err);
      setConnectionError(err.message);
    }
  }, [userId, getWsUrl, onMessage, onPresence, onTyping, onReadReceipt]);

  // Connect on mount
  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      // Cleanup on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [userId, connect]);

  // Send message
  const sendMessage = useCallback((receiverId, content, messageType = 'text', attachments = []) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'message',
        data: {
          receiver_id: receiverId,
          content,
          message_type: messageType,
          attachments
        }
      };
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('[WebSocket] Cannot send message - not connected');
    return false;
  }, []);

  // Send typing indicator
  const sendTypingIndicator = useCallback((receiverId, isTyping) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        receiver_id: receiverId,
        is_typing: isTyping
      }));
    }
  }, []);

  // Send read receipt
  const sendReadReceipt = useCallback((messageIds, senderId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && messageIds.length > 0) {
      wsRef.current.send(JSON.stringify({
        type: 'read_receipt',
        message_ids: messageIds,
        sender_id: senderId
      }));
    }
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  return {
    isConnected,
    connectionError,
    sendMessage,
    sendTypingIndicator,
    sendReadReceipt,
    reconnect
  };
};

export default useWebSocketChat;
