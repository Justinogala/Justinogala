import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = window.location.origin;

export const useWebSocketChat = (userId, onMessage, onPresence, onTyping, onReadReceipt) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [connectionType, setConnectionType] = useState(null); // 'sse' or 'ws' or 'polling'
  
  const eventSourceRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Connect using Server-Sent Events (SSE) - more reliable with reverse proxies
  const connectSSE = useCallback(() => {
    if (!userId || eventSourceRef.current) return;

    try {
      console.log('[Chat] Connecting via SSE...');
      const eventSource = new EventSource(`${API_BASE}/api/chat/stream/${userId}`);
      
      eventSource.onopen = () => {
        console.log('[Chat] SSE connection opened');
        setIsConnected(true);
        setConnectionError(null);
        setConnectionType('sse');
        reconnectAttemptsRef.current = 0;
      };

      eventSource.addEventListener('connected', (event) => {
        console.log('[Chat] SSE connected:', JSON.parse(event.data));
      });

      eventSource.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        console.log('[Chat] SSE message received:', data);
        onMessage?.(data);
      });

      eventSource.addEventListener('message_sent', (event) => {
        const data = JSON.parse(event.data);
        console.log('[Chat] SSE message sent confirmation:', data);
        onMessage?.(data);
      });

      eventSource.addEventListener('presence', (event) => {
        const data = JSON.parse(event.data);
        console.log('[Chat] SSE presence update:', data);
        onPresence?.(data);
      });

      eventSource.addEventListener('typing', (event) => {
        const data = JSON.parse(event.data);
        console.log('[Chat] SSE typing indicator:', data);
        onTyping?.(data);
      });

      eventSource.addEventListener('read_receipt', (event) => {
        const data = JSON.parse(event.data);
        console.log('[Chat] SSE read receipt:', data);
        onReadReceipt?.(data);
      });

      eventSource.addEventListener('ping', () => {
        // Keep-alive ping received, connection is healthy
      });

      eventSource.onerror = (error) => {
        console.error('[Chat] SSE error:', error);
        eventSource.close();
        eventSourceRef.current = null;
        setIsConnected(false);
        
        // Try to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`[Chat] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, delay);
        } else {
          setConnectionError('Connection lost. Click to reconnect.');
          setConnectionType('polling');
        }
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      console.error('[Chat] SSE connection failed:', err);
      setConnectionError('Could not establish connection');
      setConnectionType('polling');
    }
  }, [userId, onMessage, onPresence, onTyping, onReadReceipt]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Connect when userId changes
  useEffect(() => {
    if (userId) {
      connectSSE();
    }
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [userId, connectSSE]);

  // Send message via REST API (SSE is receive-only)
  const sendMessage = useCallback(async (receiverId, content, messageType = 'text', attachments = []) => {
    // SSE doesn't support sending, always use REST
    return false;
  }, []);

  // Send typing indicator via REST
  const sendTypingIndicator = useCallback(async (receiverId, isTyping) => {
    if (!userId) return;
    
    try {
      await fetch(`${API_BASE}/api/chat/typing?user_id=${userId}&receiver_id=${receiverId}&is_typing=${isTyping}`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('[Chat] Error sending typing indicator:', err);
    }
  }, [userId]);

  // Send read receipt via REST
  const sendReadReceipt = useCallback(async (messageIds, senderId) => {
    if (!userId || messageIds.length === 0) return;
    
    try {
      await fetch(`${API_BASE}/api/chat/messages/read?reader_id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageIds)
      });
    } catch (err) {
      console.error('[Chat] Error sending read receipt:', err);
    }
  }, [userId]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    setConnectionError(null);
    connectSSE();
  }, [connectSSE]);

  return {
    isConnected,
    connectionError,
    connectionType,
    sendMessage,
    sendTypingIndicator,
    sendReadReceipt,
    reconnect
  };
};

export default useWebSocketChat;
