
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Pin, X, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { messagingService } from '@/services/messagingService';
import { format } from 'date-fns';

const PinnedMessagesPanel = ({ conversationId, isOpen, onClose, onUnpin, onJumpToMessage }) => {
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && conversationId) {
      loadPinned();
    }
  }, [isOpen, conversationId]);

  const loadPinned = async () => {
    setLoading(true);
    try {
      const msgs = await messagingService.getPinnedMessages(conversationId);
      setPinnedMessages(msgs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnpin = async (msgId) => {
    await onUnpin(msgId);
    setPinnedMessages(prev => prev.filter(m => m.id !== msgId));
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl z-20 flex flex-col"
    >
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
          <Pin className="w-4 h-4 text-violet-600" /> Pinned Messages
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          </div>
        ) : pinnedMessages.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Pin className="w-5 h-5 opacity-50" />
            </div>
            <p className="text-sm">No pinned messages yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pinnedMessages.map((msg) => (
              <div key={msg.id} className="group bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
                <div className="flex items-start gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={msg.sender_avatar} />
                    <AvatarFallback className="text-[10px]">{msg.sender_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold truncate">{msg.sender_name}</span>
                      <span className="text-[10px] text-slate-400">{format(new Date(msg.created_at), 'MMM d, h:mm a')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 mb-2 break-words">
                  {msg.content}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/50 opacity-60 group-hover:opacity-100 transition-opacity">
                   <button 
                     onClick={() => onJumpToMessage(msg.id)}
                     className="text-xs flex items-center hover:text-violet-600"
                   >
                     <MessageSquare className="w-3 h-3 mr-1" /> Jump to
                   </button>
                   <button 
                     onClick={() => handleUnpin(msg.id)}
                     className="text-xs flex items-center hover:text-red-600"
                   >
                     <X className="w-3 h-3 mr-1" /> Unpin
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
};

export default PinnedMessagesPanel;
