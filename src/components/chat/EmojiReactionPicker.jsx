import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '👀', '🚀', '💯', '👋'];

const EmojiReactionPicker = ({ onSelect, onClose, position = 'top' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // A simplified list for demo purposes. In a real app, use a library like emoji-picker-react
  const filteredEmojis = COMMON_EMOJIS.filter(emoji => true); 

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        className={`absolute z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 w-64 ${
          position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        } right-0`}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              className="h-7 text-xs pl-7 bg-slate-50 dark:bg-slate-800 border-none" 
              placeholder="Search reaction..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X className="w-3 h-3 text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-6 gap-1">
          {filteredEmojis.map((emoji, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(emoji)}
              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-violet-50 dark:hover:bg-slate-800 rounded-lg transition-colors hover:scale-110 active:scale-95 transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmojiReactionPicker;