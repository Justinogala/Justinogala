
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic } from 'lucide-react';
import HistoryItem from './HistoryItem';
import { Button } from '@/components/ui/button';

const HistoryList = ({ items, onDelete, onView, onStartNew }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
        <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <Mic className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No conversations yet</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
          Start recording your voice to create your first conversation history.
        </p>
        <Button onClick={onStartNew} className="bg-violet-600 hover:bg-violet-700">
          Start New Recording
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <HistoryItem
              key={item.id}
              item={item}
              onDelete={onDelete}
              onClick={onView}
            />
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
};

export default HistoryList;
