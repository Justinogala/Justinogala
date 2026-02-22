
import React, { useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SearchInput = ({ 
  value, 
  onChange, 
  onClear, 
  loading, 
  onFocus, 
  onBlur,
  className 
}) => {
  const inputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      inputRef.current?.blur();
      onClear();
    }
  };

  return (
    <div className={cn("relative group w-full max-w-md", className)}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-violet-400 group-focus-within:text-violet-600 transition-colors" />
      </div>
      
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur} // Let parent handle delay if needed
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full pl-10 pr-10 py-2.5 text-sm rounded-xl transition-all duration-300",
          "bg-violet-50/50 dark:bg-slate-900/50 border border-violet-100 dark:border-violet-800",
          "text-gray-900 dark:text-gray-100 placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 focus:bg-white dark:focus:bg-slate-900",
          "shadow-sm hover:shadow-md focus:shadow-lg focus:shadow-violet-500/10"
        )}
        placeholder="Search meetings, transcriptions..."
      />

      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Loader2 className="h-4 w-4 text-violet-500 animate-spin" />
            </motion.div>
          ) : value ? (
            <motion.button
              key="clear"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={onClear}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-3 w-3" />
            </motion.button>
          ) : (
            <div key="shortcut" className="hidden sm:flex border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 text-[10px] text-gray-400 font-medium bg-gray-50 dark:bg-gray-800/50">
              ⌘K
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchInput;
