import React from 'react';
import { Pin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MessagePinner = ({ pinnedMessage, onUnpin }) => {
  if (!pinnedMessage) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-indigo-50/90 dark:bg-indigo-900/20 backdrop-blur-sm border-b border-indigo-100 dark:border-indigo-800 px-4 py-2 flex items-center justify-between z-10"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-indigo-100 dark:bg-indigo-800 p-1.5 rounded-full flex-shrink-0 text-indigo-600 dark:text-indigo-300">
            <Pin className="w-3 h-3 fill-current" />
          </div>
          <div className="min-w-0">
             <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Pinned Message</p>
             <p className="text-xs text-indigo-700 dark:text-indigo-300 truncate">{pinnedMessage.content}</p>
          </div>
        </div>
        <button onClick={onUnpin} className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200">
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default MessagePinner;