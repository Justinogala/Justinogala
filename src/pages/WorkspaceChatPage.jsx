import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useWebSocketChatContext } from '@/context/WebSocketChatContext';
import { useWebRTCCall } from '@/hooks/useWebRTCCall';
import { messagingService } from '@/services/messagingService';
import { getMembers } from '@/services/workspaceService';
import PageTransition from '@/components/PageTransition';
import EnhancedMessageInput from '@/components/chat/EnhancedMessageInput';
import CallInterface from '@/components/chat/CallInterface';
import IncomingCallModal from '@/components/chat/IncomingCallModal';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, Search, MoreVertical, Phone, Video, Info, Send, Smile,
  Paperclip, Image, Mic, Hash, Users, Settings, Bell, BellOff, Star, Pin,
  MessageSquare, Circle, CheckCheck, Clock, Sparkles, ChevronDown,
  MapPin, BarChart3, User, ArrowLeft, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import UserPresenceStatus from '@/components/chat/UserPresenceStatus';

const WorkspaceChatPage = () => {
  const { user: currentUser } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  
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
  
  const activeUser = currentUser || messagingService.getAllUsers()[0];

  // Call state
  const [incomingCall, setIncomingCall] = useState(null);
  
  // Handle incoming call notification
  const handleIncomingCall = useCallback((callData) => {
    console.log('[Call] Incoming call:', callData);
    setIncomingCall(callData);
  }, []);

  // WebRTC Call Hook
  const {
    currentCall,
    localStream,
    remoteStream,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo
  } = useWebRTCCall(activeUser?.id, handleIncomingCall);

  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [localMessages, setLocalMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [convPrefs, setConvPrefs] = useState({}); // { conv_key: { starred, pinned, muted } }
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '') + '/api';

  const getConvKey = (uid1, uid2) => {
    const a = uid1 < uid2 ? uid1 : uid2;
    const b = uid1 < uid2 ? uid2 : uid1;
    return `${a}_${b}`;
  };

  const currentConvPrefs = selectedUserId && activeUser
    ? (convPrefs[getConvKey(activeUser.id, selectedUserId)] || {})
    : {};

  // Load conversation preferences
  useEffect(() => {
    if (!activeUser?.id) return;
    const loadPrefs = async () => {
      try {
        const res = await fetch(`${API_BASE}/chat/conversations/preferences/${activeUser.id}`);
        if (res.ok) {
          const data = await res.json();
          const map = {};
          (data.preferences || []).forEach(p => { map[p.conversation_key] = p; });
          setConvPrefs(map);
        }
      } catch (e) { console.error('Failed to load chat prefs:', e); }
    };
    loadPrefs();
  }, [activeUser?.id, API_BASE]);

  const handleStarConversation = async () => {
    if (!activeUser?.id || !selectedUserId) return;
    try {
      const res = await fetch(`${API_BASE}/chat/conversations/star`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: activeUser.id, partner_id: selectedUserId }),
      });
      if (res.ok) {
        const { starred } = await res.json();
        const key = getConvKey(activeUser.id, selectedUserId);
        setConvPrefs(prev => ({ ...prev, [key]: { ...prev[key], starred } }));
        toast({ title: starred ? 'Conversation starred' : 'Star removed' });
      }
    } catch (e) { toast({ title: 'Error', description: 'Failed to star', variant: 'destructive' }); }
  };

  const handlePinConversation = async () => {
    if (!activeUser?.id || !selectedUserId) return;
    try {
      const res = await fetch(`${API_BASE}/chat/conversations/pin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: activeUser.id, partner_id: selectedUserId }),
      });
      if (res.ok) {
        const { pinned } = await res.json();
        const key = getConvKey(activeUser.id, selectedUserId);
        setConvPrefs(prev => ({ ...prev, [key]: { ...prev[key], pinned } }));
        toast({ title: pinned ? 'Pinned to top' : 'Unpinned' });
      }
    } catch (e) { toast({ title: 'Error', description: 'Failed to pin', variant: 'destructive' }); }
  };

  const handleMuteConversation = async () => {
    if (!activeUser?.id || !selectedUserId) return;
    try {
      const res = await fetch(`${API_BASE}/chat/conversations/mute`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: activeUser.id, partner_id: selectedUserId }),
      });
      if (res.ok) {
        const { muted } = await res.json();
        const key = getConvKey(activeUser.id, selectedUserId);
        setConvPrefs(prev => ({ ...prev, [key]: { ...prev[key], muted } }));
        toast({ title: muted ? 'Notifications muted' : 'Notifications unmuted' });
      }
    } catch (e) { toast({ title: 'Error', description: 'Failed to mute', variant: 'destructive' }); }
  };

  const handleClearChat = async () => {
    if (!activeUser?.id || !selectedUserId) return;
    if (!window.confirm('Clear all messages in this conversation? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE}/chat/conversations/clear`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: activeUser.id, partner_id: selectedUserId }),
      });
      if (res.ok) {
        const { deleted_count } = await res.json();
        setLocalMessages([]);
        toast({ title: 'Chat cleared', description: `${deleted_count} messages removed` });
      }
    } catch (e) { toast({ title: 'Error', description: 'Failed to clear chat', variant: 'destructive' }); }
  };

  const conversationId = selectedUserId && activeUser 
    ? getConversationId(activeUser.id, selectedUserId)
    : null;

  const messages = selectedUserId 
    ? (contextMessages[conversationId] || getConversationMessages(selectedUserId))
    : localMessages;

  const isTyping = selectedUserId ? isUserTyping(selectedUserId) : false;

  // Load workspace members instead of all users
  useEffect(() => {
    const loadWorkspaceMembers = async () => {
      if (!currentWorkspace?.id) {
        console.log('[Chat] No workspace selected, cannot load members');
        setUsers([]);
        return;
      }
      
      try {
        console.log('[Chat] Loading members for workspace:', currentWorkspace.id);
        const members = await getMembers(currentWorkspace.id);
        
        // Extract user data from members and filter out current user
        const workspaceUsers = members
          .filter(m => m.user && m.user_id !== activeUser?.id)
          .map(m => ({
            id: m.user_id,
            name: m.user?.name || m.user?.email?.split('@')[0] || 'Unknown',
            email: m.user?.email || '',
            initials: m.user?.name?.charAt(0)?.toUpperCase() || m.user?.email?.charAt(0)?.toUpperCase() || '?',
            role: m.role,
            avatar: m.user?.avatar
          }));
        
        console.log('[Chat] Loaded workspace members:', workspaceUsers.length);
        setUsers(workspaceUsers);
      } catch (err) {
        console.error('Error loading workspace members:', err);
        setUsers([]);
      }
    };
    
    if (activeUser) {
      loadWorkspaceMembers();
    }
  }, [activeUser?.id, currentWorkspace?.id]);

  useEffect(() => {
    if (selectedUserId && activeUser) {
      loadMessages(selectedUserId);
    }
  }, [selectedUserId, activeUser?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (partnerId) => {
    setIsLoadingMessages(true);
    try {
      const msgs = await loadConversationHistory(partnerId);
      
      if (!msgs || msgs.length === 0) {
        const localMsgs = await messagingService.getMessages(activeUser.id, partnerId);
        setLocalMessages(localMsgs);
      }
      
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
      let messageType = 'text';
      if (attachments.length > 0) {
        const firstAtt = attachments[0];
        messageType = firstAtt.type || 'text';
      }

      let content = text;
      
      if (attachments.length > 0) {
        for (const att of attachments) {
          if (att.type === 'image' || att.type === 'gif') {
            content += `\n[${att.type.toUpperCase()}: ${att.url}]`;
          } else if (att.type === 'file') {
            content += `\n[FILE: ${att.name}]`;
          }
        }
      }
      
      const sent = await wsSendMessage(selectedUserId, content, messageType, attachments);
      
      if (!sent) {
        const newMsg = await messagingService.sendMessage(activeUser.id, selectedUserId, content);
        setLocalMessages(prev => [...prev, newMsg]);
      }
      
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
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    sendTypingIndicator(selectedUserId, isTypingNow);
    
    if (isTypingNow) {
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(selectedUserId, false);
      }, 2000);
    }
  }, [selectedUserId, sendTypingIndicator]);

  // Derive selectedUser early before call handlers
  const selectedUser = users.find(u => u.id === selectedUserId);

  // Call handlers
  // Handle call errors from WebRTC hook (offline user, timeout, etc.)
  useEffect(() => {
    window.__callError = (message) => {
      toast({ variant: "destructive", title: "Call failed", description: message });
    };
    return () => { delete window.__callError; };
  }, [toast]);

  const handleStartAudioCall = useCallback(async () => {
    if (!selectedUserId || !selectedUser) return;
    
    try {
      await initiateCall(selectedUserId, 'audio');
      toast({ title: "Calling...", description: `Calling ${selectedUser.name}` });
    } catch (error) {
      toast({ variant: "destructive", title: "Call failed", description: error.message });
    }
  }, [selectedUserId, selectedUser, initiateCall, toast]);

  const handleStartVideoCall = useCallback(async () => {
    if (!selectedUserId || !selectedUser) return;
    
    try {
      await initiateCall(selectedUserId, 'video');
      toast({ title: "Video calling...", description: `Calling ${selectedUser.name}` });
    } catch (error) {
      toast({ variant: "destructive", title: "Call failed", description: error.message });
    }
  }, [selectedUserId, selectedUser, initiateCall, toast]);

  const handleAcceptCall = useCallback(async () => {
    if (!incomingCall) return;
    
    try {
      await acceptCall(incomingCall.caller_id, incomingCall.call_id, incomingCall.call_type);
      setIncomingCall(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Could not accept call", description: error.message });
      setIncomingCall(null);
    }
  }, [incomingCall, acceptCall, toast]);

  const handleRejectCall = useCallback(() => {
    if (!incomingCall) return;
    
    rejectCall(incomingCall.caller_id, incomingCall.call_id);
    setIncomingCall(null);
  }, [incomingCall, rejectCall]);

  const handleEndCall = useCallback(() => {
    endCall();
  }, [endCall]);

  // Find caller info for incoming call
  const incomingCallUser = incomingCall ? users.find(u => u.id === incomingCall.caller_id) : null;
  
  // Find call partner for active call
  const callPartnerUser = currentCall ? users.find(u => u.id === currentCall.targetUserId) : null;

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Helper to select user (and show chat on mobile)
  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
    setShowMobileChat(true);
  };

  // Back to sidebar on mobile
  const handleMobileBack = () => {
    setShowMobileChat(false);
  };

  const usersWithStatus = users.map(u => ({
    ...u,
    isOnline: isUserOnline(u.id)
  }));

  const filteredUsers = usersWithStatus.filter(u => 
    u.id !== activeUser?.id && 
    (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => {
    // Pinned conversations first
    const aKey = activeUser ? getConvKey(activeUser.id, a.id) : '';
    const bKey = activeUser ? getConvKey(activeUser.id, b.id) : '';
    const aPinned = convPrefs[aKey]?.pinned ? 1 : 0;
    const bPinned = convPrefs[bKey]?.pinned ? 1 : 0;
    if (bPinned !== aPinned) return bPinned - aPinned;
    // Then starred
    const aStarred = convPrefs[aKey]?.starred ? 1 : 0;
    const bStarred = convPrefs[bKey]?.starred ? 1 : 0;
    return bStarred - aStarred;
  });

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAvatarGradient = (index) => {
    const gradients = [
      'from-violet-500 to-purple-600',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-green-500',
      'from-amber-500 to-orange-500',
      'from-rose-500 to-pink-500',
      'from-indigo-500 to-blue-500',
      'from-teal-500 to-cyan-500',
      'from-fuchsia-500 to-pink-500',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <PageTransition>
      <div className="flex w-full overflow-hidden -m-4 sm:-m-6 lg:-m-8" style={{height: 'calc(100vh - 64px)'}}>
        <Helmet><title>Chat | Munal AI</title></Helmet>

        {/* Sidebar - Full width on mobile, fixed width on desktop */}
        <div className={cn(
          "flex flex-col flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50",
          "w-full md:w-80",
          showMobileChat ? "hidden md:flex" : "flex"
        )}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl shadow-lg shadow-violet-500/25">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                Messages
              </h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                <Settings className="w-4 h-4 text-gray-500" />
              </Button>
            </div>
            
            {/* User Presence Status */}
            <div className="mb-3">
              <UserPresenceStatus />
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search conversations..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-100/80 dark:bg-slate-800/80 border-0 rounded-xl h-10"
              />
            </div>
          </div>

          {/* User List */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {/* Online Now Section */}
              {filteredUsers.filter(u => isUserOnline(u.id)).length > 0 && (
                <div className="mb-4">
                  <p className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Online Now — {filteredUsers.filter(u => isUserOnline(u.id)).length}
                  </p>
                  <div className="space-y-1">
                    {filteredUsers.filter(u => isUserOnline(u.id)).map((user, index) => (
                      <UserItem 
                        key={user.id || `online-${index}`} 
                        user={user} 
                        index={index}
                        isSelected={selectedUserId === user.id}
                        onClick={() => handleSelectUser(user.id)}
                        gradient={getAvatarGradient(index)}
                        prefs={activeUser ? convPrefs[getConvKey(activeUser.id, user.id)] : null}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Messages */}
              <p className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                All Messages
              </p>
              <div className="space-y-1">
                {filteredUsers.filter(u => !isUserOnline(u.id)).map((user, index) => (
                  <UserItem 
                    key={user.id || `offline-${index}`} 
                    user={user} 
                    index={index + filteredUsers.filter(u => isUserOnline(u.id)).length}
                    isSelected={selectedUserId === user.id}
                    onClick={() => handleSelectUser(user.id)}
                    gradient={getAvatarGradient(index + filteredUsers.filter(u => isUserOnline(u.id)).length)}
                    prefs={activeUser ? convPrefs[getConvKey(activeUser.id, user.id)] : null}
                  />
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area - Full width on mobile, flex on desktop */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 relative",
          showMobileChat ? "flex" : "hidden md:flex"
        )}>
          {/* Connection Status */}
          <AnimatePresence>
            {isConnected && connectionType === 'sse' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-3 right-4 z-50"
              >
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50/80 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1.5 rounded-full backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Live
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {selectedUserId && selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Mobile back button */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden h-9 w-9 rounded-xl"
                    onClick={handleMobileBack}
                    data-testid="chat-back-btn"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="relative">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-white dark:ring-slate-800 shadow-lg">
                      <AvatarImage src={selectedUser.avatar} />
                      <AvatarFallback className={cn("text-white font-bold bg-gradient-to-br", getAvatarGradient(users.indexOf(selectedUser)))}>
                        {selectedUser.initials || selectedUser.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-white dark:border-slate-900",
                      isUserOnline(selectedUserId) ? "bg-emerald-500" : "bg-gray-400"
                    )} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate max-w-[140px] sm:max-w-none">{selectedUser.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      {isUserOnline(selectedUserId) ? (
                        <><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Active now</>
                      ) : (
                        'Offline'
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleStartAudioCall}
                    disabled={!isUserOnline(selectedUserId)}
                    data-testid="audio-call-btn"
                    title={!isUserOnline(selectedUserId) ? "User is offline" : "Start audio call"}
                  >
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleStartVideoCall}
                    disabled={!isUserOnline(selectedUserId)}
                    data-testid="video-call-btn"
                    title={!isUserOnline(selectedUserId) ? "User is offline" : "Start video call"}
                  >
                    <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hidden sm:flex h-10 w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800">
                    <Info className="w-5 h-5 text-gray-500" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800">
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handleStarConversation} data-testid="star-conversation-btn">
                        <Star className={cn("w-4 h-4 mr-2", currentConvPrefs.starred && "fill-amber-400 text-amber-400")} />
                        {currentConvPrefs.starred ? 'Unstar conversation' : 'Star conversation'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handlePinConversation} data-testid="pin-conversation-btn">
                        <Pin className={cn("w-4 h-4 mr-2", currentConvPrefs.pinned && "fill-violet-500 text-violet-500")} />
                        {currentConvPrefs.pinned ? 'Unpin' : 'Pin to top'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleMuteConversation} data-testid="mute-conversation-btn">
                        {currentConvPrefs.muted
                          ? <><BellOff className="w-4 h-4 mr-2 text-orange-500" /> Unmute notifications</>
                          : <><Bell className="w-4 h-4 mr-2" /> Mute notifications</>
                        }
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleClearChat} className="text-red-600 focus:text-red-600" data-testid="clear-chat-btn">
                        <Trash2 className="w-4 h-4 mr-2" /> Clear chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4">
                {isLoadingMessages ? (
                  <div className="flex-1 flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                      <p className="text-sm text-gray-500">Loading messages...</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center h-full">
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 rounded-3xl flex items-center justify-center mb-4 shadow-lg">
                      <MessageSquare className="w-10 h-10 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No messages yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Say hello to start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, index) => {
                      const isMine = msg.sender_id === activeUser?.id;
                      const sender = users.find(u => u.id === msg.sender_id);
                      const hasAttachments = msg.attachments && msg.attachments.length > 0;
                      
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={cn("flex gap-3", isMine ? "justify-end" : "justify-start")}
                        >
                          {!isMine && (
                            <Avatar className="h-8 w-8 mt-1">
                              <AvatarImage src={sender?.avatar} />
                              <AvatarFallback className={cn("text-white text-xs font-bold bg-gradient-to-br", getAvatarGradient(users.indexOf(sender)))}>
                                {sender?.initials || sender?.name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={cn("max-w-[70%] flex flex-col gap-2", isMine ? "items-end" : "items-start")}>
                            {/* Attachments */}
                            {hasAttachments && (
                              <div className="flex flex-col gap-2 w-full">
                                {msg.attachments.map((att, attIdx) => (
                                  <div key={attIdx}>
                                    {att.type === 'image' && att.url && (
                                      <a 
                                        href={att.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                                      >
                                        <img 
                                          src={att.url} 
                                          alt={att.name || 'Image'} 
                                          className="max-w-full max-h-64 object-cover rounded-xl"
                                        />
                                      </a>
                                    )}
                                    {att.type === 'file' && (
                                      <a 
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={att.name}
                                        className={cn(
                                          "flex items-center gap-3 p-3 rounded-xl transition-colors",
                                          isMine 
                                            ? "bg-white/20 hover:bg-white/30" 
                                            : "bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600"
                                        )}
                                      >
                                        <div className={cn(
                                          "w-10 h-10 rounded-lg flex items-center justify-center",
                                          isMine ? "bg-white/20" : "bg-indigo-100 dark:bg-indigo-900/30"
                                        )}>
                                          <Paperclip className={cn("w-5 h-5", isMine ? "text-white" : "text-indigo-600 dark:text-indigo-400")} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className={cn("text-sm font-medium truncate", isMine ? "text-white" : "text-gray-900 dark:text-white")}>
                                            {att.name || 'Document'}
                                          </p>
                                          <p className={cn("text-xs", isMine ? "text-white/70" : "text-gray-500")}>
                                            Click to download
                                          </p>
                                        </div>
                                      </a>
                                    )}
                                    {att.type === 'voice' && att.url && (
                                      <div className={cn(
                                        "p-3 rounded-xl flex items-center gap-3",
                                        isMine ? "bg-white/20" : "bg-gray-100 dark:bg-slate-700"
                                      )}>
                                        <div className={cn(
                                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                                          isMine ? "bg-white/20" : "bg-purple-100 dark:bg-purple-900/30"
                                        )}>
                                          <Mic className={cn("w-5 h-5", isMine ? "text-white" : "text-purple-600 dark:text-purple-400")} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <audio 
                                            controls 
                                            src={att.url} 
                                            className="w-full h-8" 
                                            style={{ maxWidth: '240px' }}
                                          />
                                          <p className={cn("text-[10px] mt-1", isMine ? "text-white/60" : "text-gray-400")}>
                                            Voice Message {att.duration ? `(${Math.floor(att.duration / 60)}:${String(att.duration % 60).padStart(2, '0')})` : ''}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                    {att.type === 'location' && (
                                      <div className={cn(
                                        "p-3 rounded-xl",
                                        isMine ? "bg-white/20" : "bg-gray-100 dark:bg-slate-700"
                                      )}>
                                        <div className="flex items-center gap-2 mb-2">
                                          <MapPin className={cn("w-4 h-4", isMine ? "text-white" : "text-indigo-500")} />
                                          <span className={cn("text-sm font-medium", isMine ? "text-white" : "text-gray-900 dark:text-white")}>
                                            Shared Location
                                          </span>
                                        </div>
                                        {att.lat && att.lng && (
                                          <a 
                                            href={`https://www.openstreetmap.org/?mlat=${att.lat}&mlon=${att.lng}#map=16/${att.lat}/${att.lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(
                                              "text-xs underline",
                                              isMine ? "text-white/80" : "text-indigo-600 dark:text-indigo-400"
                                            )}
                                          >
                                            View on map
                                          </a>
                                        )}
                                      </div>
                                    )}
                                    {att.type === 'poll' && (
                                      <div className={cn(
                                        "p-3 rounded-xl",
                                        isMine ? "bg-white/20" : "bg-gray-100 dark:bg-slate-700"
                                      )}>
                                        <div className="flex items-center gap-2 mb-2">
                                          <BarChart3 className={cn("w-4 h-4", isMine ? "text-white" : "text-orange-500")} />
                                          <span className={cn("text-sm font-medium", isMine ? "text-white" : "text-gray-900 dark:text-white")}>
                                            {att.question || 'Poll'}
                                          </span>
                                        </div>
                                        {att.options && att.options.map((opt, optIdx) => (
                                          <div key={optIdx} className={cn(
                                            "text-xs py-1 px-2 rounded mb-1",
                                            isMine ? "bg-white/10 text-white" : "bg-white dark:bg-slate-600 text-gray-700 dark:text-gray-200"
                                          )}>
                                            {opt.text}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {att.type === 'contact' && (
                                      <div className={cn(
                                        "p-3 rounded-xl flex items-center gap-3",
                                        isMine ? "bg-white/20" : "bg-gray-100 dark:bg-slate-700"
                                      )}>
                                        <div className={cn(
                                          "w-10 h-10 rounded-full flex items-center justify-center",
                                          isMine ? "bg-white/20" : "bg-blue-100 dark:bg-blue-900/30"
                                        )}>
                                          <User className={cn("w-5 h-5", isMine ? "text-white" : "text-blue-600 dark:text-blue-400")} />
                                        </div>
                                        <div>
                                          <p className={cn("text-sm font-medium", isMine ? "text-white" : "text-gray-900 dark:text-white")}>
                                            {att.name}
                                          </p>
                                          <p className={cn("text-xs", isMine ? "text-white/70" : "text-gray-500")}>
                                            {att.email || att.phone}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Text Message */}
                            {/* Text Message - strip inline attachment markers */}
                            {msg.content && msg.content.trim() && (() => {
                              const cleanContent = msg.content
                                .replace(/\n?\[(IMAGE|GIF|FILE):.*?\]/g, '')
                                .trim();
                              return cleanContent ? (
                                <div className={cn(
                                  "px-4 py-3 rounded-2xl",
                                  isMine 
                                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm" 
                                    : "bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-bl-sm shadow-sm border border-gray-100 dark:border-gray-700"
                                )}>
                                  <p className="text-sm whitespace-pre-wrap break-words">{cleanContent}</p>
                                </div>
                              ) : null;
                            })()}
                            
                            <div className={cn("flex items-center gap-1.5 mt-1 px-1", isMine ? "justify-end" : "justify-start")}>
                              <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp || msg.created_at)}</span>
                              {isMine && (
                                <CheckCheck className={cn("w-3.5 h-3.5", msg.is_read ? "text-blue-500" : "text-gray-400")} />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    
                    {/* Typing Indicator */}
                    <AnimatePresence>
                      {isTyping && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="flex gap-3 items-center"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={selectedUser?.avatar} />
                            <AvatarFallback className={cn("text-white text-xs font-bold bg-gradient-to-br", getAvatarGradient(users.indexOf(selectedUser)))}>
                              {selectedUser?.initials || selectedUser?.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="px-4 py-3 bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="px-3 sm:px-6 py-3 sm:py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50">
                <EnhancedMessageInput 
                  onSendMessage={handleSendMessage}
                  disabled={isSending}
                  placeholder={`Message ${selectedUser.name}...`}
                  onTyping={handleTyping}
                />
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-3xl flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/30">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Chat</h3>
              {!currentWorkspace ? (
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                  Please select a workspace first to chat with team members
                </p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                  No team members in this workspace yet. Add members from the Workspaces page to start chatting.
                </p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                  Select a team member from the sidebar to start a real-time conversation
                </p>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-400">
                {filteredUsers.length > 0 && (
                  <>
                    <div className="flex -space-x-2">
                      {filteredUsers.slice(0, 3).map((u, i) => (
                        <div key={u.id || i} className={cn("w-8 h-8 rounded-full bg-gradient-to-br ring-2 ring-white dark:ring-slate-900", getAvatarGradient(i))} />
                      ))}
                    </div>
                    <span>{filteredUsers.length} team member{filteredUsers.length !== 1 ? 's' : ''} available</span>
                  </>
                )}
                {currentWorkspace && filteredUsers.length === 0 && (
                  <span className="text-violet-500">
                    Workspace: {currentWorkspace.name}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Incoming Call Modal */}
      {incomingCall && incomingCallUser && (
        <IncomingCallModal
          caller={incomingCallUser}
          callType={incomingCall.call_type}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* Active Call Interface */}
      {currentCall && currentCall.status !== 'ended' && (
        <CallInterface
          call={currentCall}
          localStream={localStream}
          remoteStream={remoteStream}
          user={callPartnerUser}
          onEndCall={handleEndCall}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
        />
      )}
    </PageTransition>
  );
};

// User Item Component
const UserItem = ({ user, index, isSelected, onClick, gradient, prefs }) => (
  <motion.button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left relative group",
      isSelected 
        ? "bg-gradient-to-r from-violet-500/10 to-indigo-500/10 dark:from-violet-500/20 dark:to-indigo-500/20" 
        : "hover:bg-gray-100/80 dark:hover:bg-slate-800/80"
    )}
    whileHover={{ x: 4 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="relative">
      <Avatar className="h-11 w-11 ring-2 ring-white dark:ring-slate-900 shadow-sm">
        <AvatarImage src={user.avatar} />
        <AvatarFallback className={cn("text-white font-bold bg-gradient-to-br", gradient)}>
          {user.initials || user.name?.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className={cn(
        "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900",
        user.isOnline ? "bg-emerald-500" : "bg-gray-400"
      )} />
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-0.5">
        <span className={cn(
          "font-semibold text-sm truncate flex items-center gap-1",
          isSelected ? "text-violet-600 dark:text-violet-400" : "text-gray-900 dark:text-white"
        )}>
          {user.name}
          {prefs?.starred && <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />}
          {prefs?.muted && <BellOff className="w-3 h-3 text-gray-400 shrink-0" />}
        </span>
        <div className="flex items-center gap-1">
          {prefs?.pinned && <Pin className="w-3 h-3 fill-violet-500 text-violet-500" />}
          {user.isOnline && (
            <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full font-bold">
              Online
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
    </div>
    
    {isSelected && (
      <motion.div 
        layoutId="chatActiveIndicator"
        className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-gradient-to-b from-violet-500 to-indigo-500 rounded-r-full" 
      />
    )}
  </motion.button>
);

export default WorkspaceChatPage;
