import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, MessageSquare, Search, Loader2, User, Clock, 
  Paperclip, MapPin, BarChart3, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

const UserMessagesModal = ({ isOpen, onClose, user }) => {
  const [messages, setMessages] = useState([]);
  const [partners, setPartners] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserMessages();
    }
  }, [isOpen, user]);

  const fetchUserMessages = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/admin/chat/messages/${user.id}?limit=100`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setMessages(data.messages || []);
      setPartners(data.partners || {});
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPartnerName = (msg) => {
    const partnerId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
    const partner = partners[partnerId];
    return partner?.name || partner?.email?.split('@')[0] || 'Unknown User';
  };

  const getPartnerInitials = (msg) => {
    const name = getPartnerName(msg);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredMessages = messages.filter(msg => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      msg.content?.toLowerCase().includes(term) ||
      getPartnerName(msg).toLowerCase().includes(term)
    );
  });

  const renderAttachment = (att) => {
    if (!att) return null;
    
    switch (att.type) {
      case 'image':
        return (
          <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
            <ImageIcon className="w-4 h-4 text-blue-500" />
            <span className="truncate max-w-[150px]">{att.name || 'Image'}</span>
          </div>
        );
      case 'file':
        return (
          <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
            <Paperclip className="w-4 h-4 text-gray-500" />
            <span className="truncate max-w-[150px]">{att.name || 'Document'}</span>
          </div>
        );
      case 'location':
        return (
          <div className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
            <MapPin className="w-4 h-4 text-green-500" />
            <span>Location shared</span>
          </div>
        );
      case 'poll':
        return (
          <div className="flex items-center gap-2 text-sm bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
            <BarChart3 className="w-4 h-4 text-orange-500" />
            <span className="truncate max-w-[150px]">{att.question || 'Poll'}</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden m-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Chat Messages
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.name || user?.email}'s conversations
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>

          {/* Messages List */}
          <ScrollArea className="h-[450px]">
            <div className="p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
                  <p className="text-gray-500 text-sm">Loading messages...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-3">
                    <X className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-gray-500 text-sm">{error}</p>
                  <Button variant="outline" size="sm" onClick={fetchUserMessages} className="mt-3">
                    Try Again
                  </Button>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No messages found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMessages.map((msg, index) => {
                    const isSent = msg.sender_id === user?.id;
                    
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={cn(
                          "p-3 rounded-xl border transition-colors",
                          isSent 
                            ? "bg-violet-50/50 dark:bg-violet-900/10 border-violet-200/50 dark:border-violet-800/50" 
                            : "bg-gray-50 dark:bg-slate-800/50 border-gray-200/50 dark:border-gray-700/50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className={cn(
                              "text-xs font-semibold",
                              isSent 
                                ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                            )}>
                              {isSent ? (user?.name?.[0] || 'U') : getPartnerInitials(msg)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {isSent ? 'Sent to' : 'From'} {getPartnerName(msg)}
                                </span>
                                <Badge variant="outline" className={cn(
                                  "text-[10px] px-1.5 py-0",
                                  isSent ? "border-violet-300 text-violet-600" : "border-gray-300 text-gray-600"
                                )}>
                                  {isSent ? 'Sent' : 'Received'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {formatTime(msg.created_at)}
                              </div>
                            </div>
                            
                            {msg.content && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                                {msg.content}
                              </p>
                            )}
                            
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {msg.attachments.map((att, i) => (
                                  <div key={i}>{renderAttachment(att)}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
              </p>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UserMessagesModal;
