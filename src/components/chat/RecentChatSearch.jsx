
import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const RecentChatSearch = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Immediate update for local filtering feel, debounced prop call
  useEffect(() => {
    // Send to parent
    const handler = setTimeout(() => {
      onSearch(searchTerm);
    }, 150); // Faster debounce for snappier feel

    return () => clearTimeout(handler);
  }, [searchTerm, onSearch]);

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <Input
        type="text"
        placeholder="Search by name or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 pr-10 h-10 w-full bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 focus:ring-violet-500 rounded-lg transition-all"
      />
      {searchTerm && (
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

export default RecentChatSearch;
