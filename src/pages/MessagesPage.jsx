import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  Loader2, Send, Search, User, Inbox, SendHorizontal, Star, 
  Trash2, Reply, Plus, Mail, MailOpen, ArrowLeft, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/PageTransition';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

const MessagesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [thread, setThread] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [users, setUsers] = useState({});
  
  // Compose modal state
  const [showCompose, setShowCompose] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState(null);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Reply state
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Fetch inbox messages
  const fetchInbox = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/messages/inbox/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
        setUsers(data.senders || {});
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching inbox:', error);
      toast({ title: 'Error', description: 'Failed to load messages', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch sent messages
  const fetchSent = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/messages/sent/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
        setUsers(data.recipients || {});
      }
    } catch (error) {
      console.error('Error fetching sent messages:', error);
      toast({ title: 'Error', description: 'Failed to load sent messages', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch message thread
  const fetchThread = useCallback(async (messageId) => {
    try {
      const response = await fetch(`${API_URL}/api/messages/thread/${messageId}`);
      const data = await response.json();
      if (data.success) {
        setThread(data.thread);
        setUsers(prev => ({ ...prev, ...data.participants }));
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
    }
  }, []);

  // Search users
  const searchUsers = useCallback(async (query) => {
    if (!query || query.length < 2 || !user?.id) {
      setUserSearchResults([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const response = await fetch(`${API_URL}/api/messages/users/search?q=${encodeURIComponent(query)}&current_user_id=${user.id}`);
      const data = await response.json();
      if (data.success) {
        setUserSearchResults(data.users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchingUsers(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === 'inbox') {
      fetchInbox();
    } else if (activeTab === 'sent') {
      fetchSent();
    }
  }, [activeTab, fetchInbox, fetchSent]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchUsers(userSearchQuery);
    }, 300);
    return () => clearTimeout(debounce);
  }, [userSearchQuery, searchUsers]);

  // Open message
  const openMessage = async (message) => {
    setSelectedMessage(message);
    await fetchThread(message.id);
    
    // Mark as read if unread
    if (!message.is_read && message.recipient_id === user?.id) {
      try {
        await fetch(`${API_URL}/api/messages/read/${message.id}`, { method: 'PUT' });
        setMessages(prev => prev.map(m => m.id === message.id ? { ...m, is_read: true } : m));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }
  };

  // Send new message
  const handleSendMessage = async () => {
    if (!composeRecipient || !composeSubject.trim() || !composeContent.trim()) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    setSendingMessage(true);
    try {
      const response = await fetch(`${API_URL}/api/messages/send/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: composeRecipient.id,
          subject: composeSubject,
          content: composeContent
        })
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Message sent!' });
        setShowCompose(false);
        setComposeRecipient(null);
        setComposeSubject('');
        setComposeContent('');
        setUserSearchQuery('');
        if (activeTab === 'sent') fetchSent();
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to send message', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    } finally {
      setSendingMessage(false);
    }
  };

  // Send reply
  const handleSendReply = async () => {
    if (!replyContent.trim() || !selectedMessage) return;
    setSendingReply(true);
    try {
      const response = await fetch(`${API_URL}/api/messages/reply/${selectedMessage.id}/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent })
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Reply sent!' });
        setReplyContent('');
        await fetchThread(selectedMessage.id);
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to send reply', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({ title: 'Error', description: 'Failed to send reply', variant: 'destructive' });
    } finally {
      setSendingReply(false);
    }
  };

  // Toggle star
  const toggleStar = async (messageId, e) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${API_URL}/api/messages/star/${messageId}`, { method: 'PUT' });
      const data = await response.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_starred: data.is_starred } : m));
      }
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  // Delete message
  const deleteMessage = async (messageId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const response = await fetch(`${API_URL}/api/messages/${messageId}/${user.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Message deleted' });
        setMessages(prev => prev.filter(m => m.id !== messageId));
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
          setThread([]);
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({ title: 'Error', description: 'Failed to delete message', variant: 'destructive' });
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredMessages = messages.filter(msg => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      msg.subject?.toLowerCase().includes(searchLower) ||
      msg.content?.toLowerCase().includes(searchLower) ||
      msg.sender_name?.toLowerCase().includes(searchLower) ||
      msg.recipient_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-6 h-[calc(100vh-5rem)]">
        <div className="flex gap-4 h-full">
          {/* Sidebar */}
          <Card className="w-64 flex-shrink-0 flex flex-col bg-white dark:bg-slate-900">
            <div className="p-4">
              <Button 
                onClick={() => setShowCompose(true)} 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                data-testid="compose-message-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Compose
              </Button>
            </div>
            
            <nav className="flex-1 px-2">
              <button
                onClick={() => { setActiveTab('inbox'); setSelectedMessage(null); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                  activeTab === 'inbox' 
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" 
                    : "hover:bg-gray-100 dark:hover:bg-slate-800"
                )}
                data-testid="inbox-tab"
              >
                <Inbox className="w-5 h-5" />
                <span className="flex-1">Inbox</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                    {unreadCount}
                  </Badge>
                )}
              </button>
              
              <button
                onClick={() => { setActiveTab('sent'); setSelectedMessage(null); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mt-1",
                  activeTab === 'sent' 
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" 
                    : "hover:bg-gray-100 dark:hover:bg-slate-800"
                )}
                data-testid="sent-tab"
              >
                <SendHorizontal className="w-5 h-5" />
                <span>Sent</span>
              </button>
            </nav>
          </Card>

          {/* Main Content */}
          <Card className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
            {selectedMessage ? (
              /* Message Thread View */
              <>
                <div className="p-4 border-b flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={() => { setSelectedMessage(null); setThread([]); }}>
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="flex-1">
                    <h2 className="font-semibold text-lg">{selectedMessage.subject}</h2>
                    <p className="text-sm text-muted-foreground">
                      {thread.length} message{thread.length !== 1 ? 's' : ''} in this conversation
                    </p>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {thread.map((msg) => {
                      const isMe = msg.sender_id === user?.id;
                      const sender = users[msg.sender_id];
                      return (
                        <div key={msg.id} className={cn("flex gap-3", isMe && "flex-row-reverse")}>
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarImage src={sender?.avatar} />
                            <AvatarFallback className="bg-indigo-100 text-indigo-700">
                              {getInitials(sender?.name || msg.sender_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={cn("flex-1 max-w-[70%]", isMe && "text-right")}>
                            <div className={cn(
                              "rounded-lg p-4",
                              isMe 
                                ? "bg-indigo-600 text-white" 
                                : "bg-gray-100 dark:bg-slate-800"
                            )}>
                              <p className={cn("text-xs mb-2", isMe ? "text-indigo-200" : "text-muted-foreground")}>
                                {msg.sender_name} • {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                              </p>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                
                {/* Reply Box */}
                <div className="p-4 border-t bg-gray-50 dark:bg-slate-800/50">
                  <div className="flex gap-2">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write your reply..."
                      className="flex-1 min-h-[80px] resize-none"
                      data-testid="reply-input"
                    />
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button 
                      onClick={handleSendReply} 
                      disabled={!replyContent.trim() || sendingReply}
                      data-testid="send-reply-btn"
                    >
                      {sendingReply ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Reply className="w-4 h-4 mr-2" />}
                      Send Reply
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* Message List View */
              <>
                <div className="p-4 border-b flex items-center justify-between gap-4">
                  <h2 className="font-semibold text-lg capitalize">{activeTab}</h2>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search messages..."
                        className="pl-9 w-64"
                        data-testid="search-messages-input"
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => activeTab === 'inbox' ? fetchInbox() : fetchSent()}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="flex-1">
                  {loading ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    </div>
                  ) : filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <Mail className="w-12 h-12 mb-2 opacity-50" />
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredMessages.map((msg) => {
                        const otherUserId = activeTab === 'inbox' ? msg.sender_id : msg.recipient_id;
                        const otherUser = users[otherUserId];
                        const displayName = activeTab === 'inbox' ? msg.sender_name : msg.recipient_name;
                        
                        return (
                          <div
                            key={msg.id}
                            onClick={() => openMessage(msg)}
                            className={cn(
                              "flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors",
                              !msg.is_read && activeTab === 'inbox' && "bg-indigo-50/50 dark:bg-indigo-900/10"
                            )}
                            data-testid={`message-item-${msg.id}`}
                          >
                            <Avatar className="w-10 h-10 flex-shrink-0">
                              <AvatarImage src={otherUser?.avatar} />
                              <AvatarFallback className="bg-indigo-100 text-indigo-700">
                                {getInitials(displayName)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn("font-medium", !msg.is_read && activeTab === 'inbox' && "font-semibold")}>
                                  {displayName}
                                </span>
                                {!msg.is_read && activeTab === 'inbox' && (
                                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-xs">New</Badge>
                                )}
                              </div>
                              <p className={cn("text-sm truncate", !msg.is_read && activeTab === 'inbox' ? "font-medium text-gray-900 dark:text-white" : "text-muted-foreground")}>
                                {msg.subject}
                              </p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {msg.content?.slice(0, 80)}...
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(msg.created_at), 'MMM d')}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => toggleStar(msg.id, e)}
                              >
                                <Star className={cn("w-4 h-4", msg.is_starred && "fill-yellow-400 text-yellow-400")} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                onClick={(e) => deleteMessage(msg.id, e)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </Card>
        </div>

        {/* Compose Modal */}
        <Dialog open={showCompose} onOpenChange={setShowCompose}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>New Message</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Recipient Search */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">To:</label>
                {composeRecipient ? (
                  <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-slate-800 rounded-lg">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={composeRecipient.avatar} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">
                        {getInitials(composeRecipient.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{composeRecipient.name || composeRecipient.email}</p>
                      <p className="text-xs text-muted-foreground">{composeRecipient.email}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setComposeRecipient(null)}>
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search users by name or email..."
                      data-testid="recipient-search-input"
                    />
                    {searchingUsers && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />
                    )}
                    {userSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {userSearchResults.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              setComposeRecipient(u);
                              setUserSearchQuery('');
                              setUserSearchResults([]);
                            }}
                            className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            data-testid={`user-result-${u.id}`}
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={u.avatar} />
                              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">
                                {getInitials(u.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                              <p className="font-medium text-sm">{u.name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Subject */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Subject:</label>
                <Input
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Enter subject..."
                  data-testid="compose-subject-input"
                />
              </div>
              
              {/* Content */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Message:</label>
                <Textarea
                  value={composeContent}
                  onChange={(e) => setComposeContent(e.target.value)}
                  placeholder="Write your message..."
                  className="min-h-[150px]"
                  data-testid="compose-content-input"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
              <Button 
                onClick={handleSendMessage} 
                disabled={!composeRecipient || !composeSubject.trim() || !composeContent.trim() || sendingMessage}
                data-testid="send-message-btn"
              >
                {sendingMessage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default MessagesPage;
