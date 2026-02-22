
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const SummaryPanel = ({ summary }) => {
  if (!summary) return null;

  return (
    <Card className="h-full border-l-4 border-l-violet-500 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl text-gray-800 dark:text-gray-100">
          <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          Executive Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="prose dark:prose-invert max-w-none"
        >
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
            {summary.text}
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default SummaryPanel;
