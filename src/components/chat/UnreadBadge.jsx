
import React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const UnreadBadge = ({ count, className }) => {
  if (!count || count <= 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className={cn(
          "flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-violet-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900",
          className
        )}
      >
        {count > 99 ? '99+' : count}
      </motion.div>
    </AnimatePresence>
  );
};

export default UnreadBadge;
