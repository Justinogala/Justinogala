import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/context/AuthContext';
import { useWebSocketChatContext } from '@/context/WebSocketChatContext';
import { messagingService } from '@/services/messagingService';
import PageTransition from '@/components/PageTransition';
import UserListSidebar from '@/components/chat/UserListSidebar';
import MessageList from '@/components/chat/MessageList';
import EnhancedMessageInput from '@/components/chat/EnhancedMessageInput';
import UserInfoHeader from '@/components/chat/UserInfoHeader';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const WorkspaceChatPage = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  // Chat context for messaging
  const {
    isUserOnline,
    messages: contextMessages,
    sendMessage: wsSendMessage,
    getConversationMessages,
    getConversationId,
    loadConversationHistory,
    markAsRead,
    sendTypingIndicator,
    isUserTyping,
    isConnected,
    connectionType
  } = useWebSocketChatContext();
  
  // For demo: use current user or fallback
  const activeUser = currentUser || messagingService.getAllUsers()[0];

  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [localMessages, setLocalMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Get conversation ID for current selection
  const conversationId = selectedUserId && activeUser 
    ? getConversationId(activeUser.id, selectedUserId)
    : null;

  // Get messages from WebSocket context - subscribe to contextMessages changes
  const messages = selectedUserId 
    ? (contextMessages[conversationId] || getConversationMessages(selectedUserId))
    : localMessages;

  // Check if selected user is typing
  const isTyping = selectedUserId ? isUserTyping(selectedUserId) : false;

  // Initial Load - get users list
  useEffect(() => {
    setUsers(messagingService.getAllUsers());
  }, []);

  // Load messages when user selected
  useEffect(() => {
    if (selectedUserId && activeUser) {
      loadMessages(selectedUserId);
    }
  }, [selectedUserId, activeUser?.id]);

  const loadMessages = async (partnerId) => {
    setIsLoadingMessages(true);
    try {
      // Try to load from WebSocket context first (includes real-time messages)
      const msgs = await loadConversationHistory(partnerId);
      
      // If no messages from WebSocket, fall back to local service
      if (!msgs || msgs.length === 0) {
        const localMsgs = await messagingService.getMessages(activeUser.id, partnerId);
        setLocalMessages(localMsgs);
      }
      
      // Mark unread messages as read
      const unreadIds = msgs
        .filter(m => m.sender_id === partnerId && !m.is_read)
        .map(m => m.id);
      
      if (unreadIds.length > 0) {
        markAsRead(unreadIds, partnerId);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      toast({ variant: "destructive", title: "Error", description: "Failed to load messages" });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (text, attachments = []) => {
    if (!selectedUserId || (!text.trim() && attachments.length === 0)) return;
    
    setIsSending(true);
    try {
      // Determine message type based on attachments
      let messageType = 'text';
      if (attachments.length > 0) {
        const firstAtt = attachments[0];
        messageType = firstAtt.type || 'text';
      }

      // Build message content
      let content = text;
      
      // Append attachment info to content (for display purposes)
      if (attachments.length > 0) {
        for (const att of attachments) {
          if (att.type === 'image' || att.type === 'gif') {
            content += `\n[${att.type.toUpperCase()}: ${att.url}]`;
          } else if (att.type === 'location') {
            content += `\n[LOCATION: ${att.lat}, ${att.lng}]`;
          } else if (att.type === 'poll') {
            content += `\n[POLL: ${att.question}]`;
          } else if (att.type === 'contact') {
            content += `\n[CONTACT: ${att.name} - ${att.email}]`;
          } else if (att.type === 'voice') {
            content += `\n[VOICE MESSAGE: ${att.duration}s]`;
          } else if (att.type === 'file') {
            content += `\n[FILE: ${att.name}]`;
          }
        }
      }
      
      // Send via WebSocket
      const sent = await wsSendMessage(selectedUserId, content, messageType, attachments);
      
      if (!sent) {
        // Fallback to local service if WebSocket failed
        const newMsg = await messagingService.sendMessage(activeUser.id, selectedUserId, content);
        setLocalMessages(prev => [...prev, newMsg]);
      }
      
      // Stop typing indicator
      sendTypingIndicator(selectedUserId, false);
      
    } catch (err) {
      console.error('Error sending message:', err);
      toast({ variant: "destructive", title: "Failed to send message" });
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = useCallback((isTypingNow) => {
    if (!selectedUserId) return;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing indicator
    sendTypingIndicator(selectedUserId, isTypingNow);
    
    // Auto-stop typing after 2 seconds of inactivity
    if (isTypingNow) {
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(selectedUserId, false);
      }, 2000);
    }
  }, [selectedUserId, sendTypingIndicator]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const selectedUser = users.find(u => u.id === selectedUserId);

  // Add online status to users
  const usersWithStatus = users.map(u => ({
    ...u,
    isOnline: isUserOnline(u.id)
  }));

  return (
    <PageTransition>
      <div className="flex w-full bg-slate-50 dark:bg-slate-950 overflow-hidden -m-4 sm:-m-6 lg:-m-8" style={{height: 'calc(100vh - 64px)'}}>
        <Helmet><title>Workspace Chat | Munal</title></Helmet>

        {/* Sidebar */}
        <UserListSidebar 
          users={usersWithStatus.filter(u => u.id !== activeUser?.id)} 
          selectedUserId={selectedUserId}
          onSelectUser={setSelectedUserId}
        />

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 relative">
          {/* Connection Status */}
          {!isConnected && (
            <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-yellow-900 text-xs text-center py-1 z-50">
              Reconnecting...
            </div>
          )}
          {isConnected && connectionType === 'sse' && (
            <div className="absolute top-0 right-4 z-50">
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-b-md">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live
              </div>
            </div>
          )}
          
          {selectedUserId ? (
            <>
              <UserInfoHeader 
                user={selectedUser} 
                isOnline={isUserOnline(selectedUserId)}
              />
              
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                {isLoadingMessages ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                  </div>
                ) : (
                  <MessageList 
                    messages={messages} 
                    currentUserId={activeUser?.id}
                    users={users}
                    isTyping={isTyping}
                  />
                )}
              </div>

              <EnhancedMessageInput 
                onSendMessage={handleSendMessage}
                disabled={isSending}
                placeholder="Type a message to your team..."
                onTyping={handleTyping}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Workspace Chat</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                Select a team member from the sidebar to start collaborating in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default WorkspaceChatPage;
