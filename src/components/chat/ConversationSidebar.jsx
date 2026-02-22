import React, { useState, useMemo } from 'react';
import { Search, Plus, Hash, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const HighlightedText = ({ text, highlight }) => {
  if (!highlight || !text) return <span className="truncate">{text}</span>;
  
  try {
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span className="truncate">
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? 
          <span key={i} className="bg-yellow-200 text-yellow-900 dark:bg-yellow-600/40 dark:text-yellow-100 rounded px-0.5 font-medium">{part}</span> : 
          part
        )}
      </span>
    );
  } catch (e) {
    return <span className="truncate">{text}</span>;
  }
};

const ConversationSidebar = ({ 
  conversations = [], 
  activeId, 
  onSelect, 
  onNewChat 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Local filtering based on internal search state
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    return conversations.filter(conv => 
      conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  return (
    <div className="w-full h-full flex flex-col bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-violet-100 dark:border-violet-800/50 bg-white/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-purple-600 dark:from-violet-300 dark:to-purple-200 tracking-tight">
            Messages
          </h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={onNewChat} 
                  size="icon" 
                  variant="ghost" 
                  className="h-9 w-9 rounded-full bg-violet-50 text-violet-600 hover:bg-violet-100 hover:text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50 transition-all shadow-sm hover:shadow-md"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create new conversation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-violet-400 group-focus-within:text-violet-600 transition-colors" />
          <Input 
            placeholder="Search conversations..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 bg-violet-50/50 dark:bg-slate-900/50 border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500 rounded-xl transition-all shadow-inner focus:bg-white dark:focus:bg-slate-900"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {/* List Header */}
          <h3 className="px-3 py-2 text-xs font-bold text-violet-400 dark:text-violet-500 uppercase tracking-wider flex items-center justify-between">
            <span>Recent Chats</span>
            <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 px-1.5 py-0.5 rounded text-[10px]">
              {filteredConversations.length}
            </span>
          </h3>

          <AnimatePresence initial={false}>
            {filteredConversations.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-3 py-8 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-5 h-5 text-violet-300" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No conversations found</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  We couldn't find any matches for "{searchQuery}"
                </p>
              </motion.div>
            ) : (
              filteredConversations.map((conv) => (
                <motion.button
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  layoutId={`conv-${conv.id}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden border",
                    activeId === conv.id 
                      ? "bg-white dark:bg-slate-800 shadow-md border-violet-100 dark:border-violet-700/50" 
                      : "bg-transparent border-transparent hover:bg-white/60 dark:hover:bg-slate-800/40 hover:border-violet-50 dark:hover:border-violet-800/30"
                  )}
                >
                  {activeId === conv.id && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="absolute left-0 w-1 h-8 bg-gradient-to-b from-violet-600 to-purple-600 rounded-r-full shadow-[0_0_10px_rgba(124,58,237,0.4)]"
                    />
                  )}
                  
                  <div className="relative flex-shrink-0">
                    <Avatar className={cn(
                      "h-11 w-11 shadow-sm transition-all duration-200",
                      activeId === conv.id ? "ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-slate-900" : "group-hover:scale-105"
                    )}>
                      <AvatarImage src={conv.avatar} />
                      <AvatarFallback className={cn(
                        "text-sm font-bold bg-gradient-to-br",
                        activeId === conv.id 
                          ? "from-violet-600 to-purple-600 text-white" 
                          : "from-violet-100 to-purple-100 text-violet-600 dark:from-violet-900 dark:to-purple-900 dark:text-violet-300"
                      )}>
                        {conv.type === 'group' ? <Hash className="w-4 h-4" /> : conv.name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-950 shadow-sm animate-bounce">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className={cn(
                        "font-semibold text-sm truncate pr-2",
                        activeId === conv.id ? "text-violet-900 dark:text-white" : "text-gray-700 dark:text-gray-200"
                      )}>
                        <HighlightedText text={conv.name} highlight={searchQuery} />
                      </span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 tabular-nums">
                        {conv.updated_at && new Date(conv.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs truncate transition-colors line-clamp-1",
                      activeId === conv.id 
                        ? "text-violet-600 dark:text-violet-300 font-medium" 
                        : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                    )}>
                      <HighlightedText text={conv.last_message || 'Start a conversation'} highlight={searchQuery} />
                    </p>
                  </div>
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationSidebar;