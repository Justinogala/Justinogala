import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = window.location.origin;

export const useWebSocketChat = (userId, onMessage, onPresence, onTyping, onReadReceipt, onCriticalIncident) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [connectionType, setConnectionType] = useState(null);
  
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const connectSSERef = useRef(null);
  const maxReconnectAttempts = 10;

  // Use refs for callbacks to prevent connectSSE from being recreated
  const onMessageRef = useRef(onMessage);
  const onPresenceRef = useRef(onPresence);
  const onTypingRef = useRef(onTyping);
  const onReadReceiptRef = useRef(onReadReceipt);
  const onCriticalIncidentRef = useRef(onCriticalIncident);
  const userIdRef = useRef(userId);

  // Keep refs in sync without triggering reconnection
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onPresenceRef.current = onPresence; }, [onPresence]);
  useEffect(() => { onTypingRef.current = onTyping; }, [onTyping]);
  useEffect(() => { onReadReceiptRef.current = onReadReceipt; }, [onReadReceipt]);
  useEffect(() => { onCriticalIncidentRef.current = onCriticalIncident; }, [onCriticalIncident]);
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  // Connect using Server-Sent Events (SSE) - stable, no callback dependencies
  const connectSSE = useCallback(() => {
    const uid = userIdRef.current;
    if (!uid || eventSourceRef.current) return;

    try {
      console.log('[Chat] Connecting via SSE...');
      const eventSource = new EventSource(`${API_BASE}/api/chat/stream/${uid}`);
      
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

      eventSource.addEventListener('new_message', (event) => {
        const data = JSON.parse(event.data);
        onMessageRef.current?.(data);
      });

      eventSource.addEventListener('message_sent', (event) => {
        const data = JSON.parse(event.data);
        onMessageRef.current?.(data);
      });

      eventSource.addEventListener('presence', (event) => {
        const data = JSON.parse(event.data);
        onPresenceRef.current?.(data);
      });

      eventSource.addEventListener('typing', (event) => {
        const data = JSON.parse(event.data);
        onTypingRef.current?.(data);
      });

      eventSource.addEventListener('read_receipt', (event) => {
        const data = JSON.parse(event.data);
        onReadReceiptRef.current?.(data);
      });

      // App update notification from admin
      eventSource.addEventListener('app_update', (event) => {
        const data = JSON.parse(event.data);
        window.dispatchEvent(new CustomEvent('munal-app-update', { detail: data }));
      });

      // Call-related SSE events
      const callEvents = ['incoming_call', 'call_accepted', 'call_rejected', 'call_ended', 'webrtc_offer', 'webrtc_answer', 'webrtc_ice_candidate'];
      callEvents.forEach(eventName => {
        eventSource.addEventListener(eventName, (event) => {
          const data = JSON.parse(event.data);
          if (window.__webrtcCallHandler) {
            window.__webrtcCallHandler({ type: eventName, data });
          }
        });
      });

      // Group call events
      const groupCallEvents = ['group_call_participant_joined', 'group_call_participant_left', 'group_call_signal', 'group_call_participant_updated'];
      groupCallEvents.forEach(eventName => {
        eventSource.addEventListener(eventName, (event) => {
          const data = JSON.parse(event.data);
          const typeMap = {
            'group_call_participant_joined': 'participant_joined',
            'group_call_participant_left': 'participant_left',
            'group_call_signal': 'signal',
            'group_call_participant_updated': 'participant_updated'
          };
          if (window.__groupCallHandler) {
            window.__groupCallHandler({ type: typeMap[eventName], data });
          }
        });
      });

      eventSource.addEventListener('critical_incident', (event) => {
        const data = JSON.parse(event.data);
        onCriticalIncidentRef.current?.(data);
      });

      eventSource.addEventListener('ping', () => {
        // Keep-alive ping received, connection is healthy
      });

      eventSource.onerror = () => {
        console.warn('[Chat] SSE connection error, will reconnect...');
        eventSource.close();
        eventSourceRef.current = null;
        setIsConnected(false);
        
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(2000 * Math.pow(1.5, reconnectAttemptsRef.current - 1), 30000);
          console.log(`[Chat] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (connectSSERef.current) connectSSERef.current();
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
  }, []); // No dependencies - uses refs for everything

  // Keep connectSSERef in sync
  useEffect(() => { connectSSERef.current = connectSSE; }, [connectSSE]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Connect when userId changes - only depends on userId, not connectSSE
  useEffect(() => {
    if (userId) {
      // Close existing connection if userId changed
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectAttemptsRef.current = 0;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      connectSSE();
    }
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [userId, connectSSE]);

  // Send typing indicator via REST
  const sendTypingIndicator = useCallback(async (receiverId, isTyping) => {
    const uid = userIdRef.current;
    if (!uid) return;
    
    try {
      await fetch(`${API_BASE}/api/chat/typing?user_id=${uid}&receiver_id=${receiverId}&is_typing=${isTyping}`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('[Chat] Error sending typing indicator:', err);
    }
  }, []);

  // Send read receipt via REST
  const sendReadReceipt = useCallback(async (messageIds, senderId) => {
    const uid = userIdRef.current;
    if (!uid || messageIds.length === 0) return;
    
    try {
      await fetch(`${API_BASE}/api/chat/messages/read?reader_id=${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageIds)
      });
    } catch (err) {
      console.error('[Chat] Error sending read receipt:', err);
    }
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttemptsRef.current = 0;
    setConnectionError(null);
    connectSSE();
  }, [connectSSE]);

  return {
    isConnected,
    connectionError,
    connectionType,
    sendTypingIndicator,
    sendReadReceipt,
    reconnect
  };
};

export default useWebSocketChat;
