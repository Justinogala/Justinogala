
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Calendar, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

const ChatSearchPanel = ({ isOpen, onClose, onSearch, results, loading }) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const handleSearch = (e) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <motion.div 
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950 flex flex-col h-full overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Search</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search messages..." 
            className="pl-9"
            value={query}
            onChange={handleSearch}
            autoFocus
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Searching...</div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase">{results.length} results found</p>
            {results.map((msg) => (
              <div key={msg.id} className="p-3 rounded-lg bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition-colors group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-xs text-indigo-600 dark:text-indigo-400">{msg.sender_name || 'User'}</span>
                  <span className="text-[10px] text-gray-400">{format(new Date(msg.created_at), 'MMM d, h:mm a')}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                  {msg.content}
                </p>
              </div>
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
            <p>No messages found</p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
            <p>Type to search in conversation</p>
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
};

export default ChatSearchPanel;
