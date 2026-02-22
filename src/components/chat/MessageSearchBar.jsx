import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MessageSearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <Input
        type="text"
        placeholder="Search messages, users, or emails..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 pr-10 h-10 w-full bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 focus:ring-violet-500 rounded-lg transition-all"
      />
      {query && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 h-full px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default MessageSearchBar;