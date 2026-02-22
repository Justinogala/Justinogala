
import React from 'react';
import { motion } from 'framer-motion';
import { File, X, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const FileUploadProgress = ({ file, progress, onCancel }) => {
  if (!file) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-2 flex items-center gap-3 shadow-sm"
    >
      <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded flex items-center justify-center shrink-0">
        <File className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
          <span className="text-xs text-gray-500">{progress}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={onCancel}>
        <X className="w-4 h-4" />
      </Button>
    </motion.div>
  );
};

export default FileUploadProgress;
