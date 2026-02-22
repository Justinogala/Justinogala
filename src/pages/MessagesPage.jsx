import React, { useState, useEffect, useRef } from 'react';
import { useMessaging } from '@/hooks/useMessaging';
import { useAuth } from '@/context/AuthContext';
import { messagingService } from '@/services/messagingService';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Search, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/PageTransition';

const MessagesPage = () => {
  const { user } = useAuth();
  const [activeConvId, setActiveConvId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  
  // Hook for active conversation messages
  const { messages, sendMessage, refreshMessages } = useMessaging(activeConvId);
  const [newMessage, setNewMessage] = useState('');
  const bottomRef = useRef(null);

  // Initialize: Get or Create conversation with Admin
  useEffect(() => {
    if (!user) return;
    const init = async () => {
      setLoadingConvs(true);
      // For this demo, we assume 1 main support chat
      // In real app, we list multiple. Here we try to get existing or create one.
      let userConvs = await messagingService.getConversations(user.id);
      
      if (userConvs.length === 0) {
        // Create initial support convo
        await messagingService.createConversation(user.id, 'admin');
        userConvs = await messagingService.getConversations(user.id);
      }
      
      setConversations(userConvs);
      if (userConvs.length > 0) setActiveConvId(userConvs[0].id);
      setLoadingConvs(false);
    };
    init();
  }, [user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await sendMessage(newMessage);
    setNewMessage('');
  };

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8 h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
          
          {/* Sidebar */}
          <Card className="col-span-1 flex flex-col h-full overflow-hidden border-r bg-white dark:bg-slate-900">
            <div className="p-4 border-b">
              <h2 className="font-bold text-lg mb-4">Messages</h2>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-8" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingConvs ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                </div>
              ) : (
                conversations.map(conv => (
                  <div 
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={cn(
                      "p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border-b border-gray-50 dark:border-gray-800",
                      activeConvId === conv.id ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500" : ""
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">Munal Support</p>
                        <p className="text-xs text-muted-foreground">
                           {format(new Date(conv.updated_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="col-span-1 md:col-span-3 flex flex-col h-full bg-gray-50 dark:bg-slate-950/50">
            {activeConvId ? (
              <>
                <div className="p-4 border-b bg-white dark:bg-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="font-semibold">Munal Support Team</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                            isMe 
                              ? "bg-indigo-600 text-white rounded-br-none" 
                              : "bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-700"
                          )}>
                            <p>{msg.content}</p>
                            <p className={cn("text-[10px] mt-1 opacity-70", isMe ? "text-indigo-100" : "text-gray-400")}>
                              {format(new Date(msg.created_at), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border-t">
                  <form onSubmit={handleSend} className="flex gap-2">
                    <Input 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation to start chatting
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default MessagesPage;