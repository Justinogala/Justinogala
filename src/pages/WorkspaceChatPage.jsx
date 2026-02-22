
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/context/AuthContext';
import { messagingService } from '@/services/messagingService';
import PageTransition from '@/components/PageTransition';
import UserListSidebar from '@/components/chat/UserListSidebar';
import MessageList from '@/components/chat/MessageList';
import EnhancedMessageInput from '@/components/chat/EnhancedMessageInput';
import UserInfoHeader from '@/components/chat/UserInfoHeader';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const WorkspaceChatPage = () => {
  const { user: currentUser } = useAuth(); // In a real app, this comes from auth context
  const { toast } = useToast();
  
  // For demo: verify we have a user, otherwise pick the first admin as "me"
  const activeUser = currentUser || messagingService.getAllUsers()[0];

  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Initial Load
  useEffect(() => {
    setUsers(messagingService.getAllUsers());
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    const unsubscribe = messagingService.subscribeToEvents((event) => {
      if (event.type === 'NEW_MESSAGE') {
        const msg = event.payload;
        // Only append if it belongs to current conversation
        if (
          (msg.senderId === activeUser.id && msg.receiverId === selectedUserId) ||
          (msg.senderId === selectedUserId && msg.receiverId === activeUser.id)
        ) {
          setMessages(prev => [...prev, msg]);
          if (msg.senderId === selectedUserId) {
            messagingService.markAsRead([msg.id]);
          }
        }
      } 
      else if (event.type === 'TYPING_STATUS') {
        const { senderId, isTyping: typingStatus } = event.payload;
        if (senderId === selectedUserId) {
          setIsTyping(typingStatus);
        }
      }
    });

    return () => unsubscribe();
  }, [activeUser.id, selectedUserId]);

  // Load messages when user selected
  useEffect(() => {
    if (selectedUserId && activeUser) {
      loadMessages(selectedUserId);
    }
  }, [selectedUserId, activeUser]);

  const loadMessages = async (partnerId) => {
    setIsLoadingMessages(true);
    try {
      const msgs = await messagingService.getMessages(activeUser.id, partnerId);
      setMessages(msgs);
      
      // Mark unread as read
      const unreadIds = msgs
        .filter(m => m.senderId === partnerId && !m.isRead)
        .map(m => m.id);
      
      if (unreadIds.length > 0) {
        await messagingService.markAsRead(unreadIds);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load messages" });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (text) => {
    if (!selectedUserId) return;
    
    setIsSending(true);
    try {
      // Optimistic update handled by service subscription or local append?
      // Service posts event, so we'll wait for that or just append locally for instant feedback
      const newMsg = await messagingService.sendMessage(activeUser.id, selectedUserId, text);
      setMessages(prev => [...prev, newMsg]);
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to send" });
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (typing) => {
    if (selectedUserId) {
      messagingService.sendTypingIndicator(activeUser.id, selectedUserId, typing);
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-64px)] w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <Helmet><title>Workspace Chat | Munal</title></Helmet>

        {/* Sidebar */}
        <UserListSidebar 
          users={users.filter(u => u.id !== activeUser.id)} 
          selectedUserId={selectedUserId}
          onSelectUser={setSelectedUserId}
        />

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 relative">
          {selectedUserId ? (
            <>
              <UserInfoHeader user={selectedUser} />
              
              {isLoadingMessages ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                </div>
              ) : (
                <MessageList 
                  messages={messages} 
                  currentUserId={activeUser.id}
                  users={users}
                  isTyping={isTyping}
                />
              )}

              <MessageInput 
                onSend={handleSendMessage}
                onTyping={handleTyping}
                isSending={isSending}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="w-24 h-24 bg-violet-100 dark:bg-violet-900/20 rounded-3xl flex items-center justify-center mb-6 text-4xl animate-in zoom-in duration-500">
                💬
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Workspace Chat</h2>
              <p className="text-slate-500 max-w-sm">
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
