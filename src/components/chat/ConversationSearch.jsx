
import React, { useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';

const ConversationSearch = ({ isOpen, onClose, onSearch, results, loading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute top-0 right-0 h-full w-80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-l border-gray-200 dark:border-slate-800 shadow-2xl z-30 flex flex-col"
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-slate-800">
        <h3 className="font-semibold text-gray-900 dark:text-white">Search Chat</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages..."
              className="pl-9 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
              autoFocus
            />
          </div>
        </form>
      </div>

      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center pt-10 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span className="text-sm">Searching...</span>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result) => (
              <div key={result.id} className="p-3 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-xs text-indigo-600 dark:text-indigo-400">{result.sender_name}</span>
                  <span className="text-[10px] text-gray-400">{new Date(result.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                  {result.content}
                </p>
              </div>
            ))}
          </div>
        ) : query ? (
          <div className="text-center pt-10 text-gray-500 text-sm">
            No results found for "{query}"
          </div>
        ) : (
          <div className="text-center pt-10 text-gray-400 text-sm">
            Type to search messages in this conversation.
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
};

export default ConversationSearch;
