
import React from 'react';
import { FileAudio, FileVideo, FileText, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const FilePreview = ({ file, onRemove, status }) => {
  if (!file) return null;

  const getIcon = () => {
    const type = file.type;
    if (type.startsWith('audio/')) return <FileAudio className="w-8 h-8 text-violet-500" />;
    if (type.startsWith('video/')) return <FileVideo className="w-8 h-8 text-blue-500" />;
    return <FileText className="w-8 h-8 text-orange-500" />;
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn(
      "relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
      status === 'success' 
        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" 
        : "bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 shadow-sm"
    )}>
      <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 dark:text-white truncate" title={file.name}>
          {file.name}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {formatSize(file.size)}
          </p>
          {status === 'success' && (
             <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
               <CheckCircle2 className="w-3 h-3" /> Uploaded
             </span>
          )}
        </div>
      </div>

      {onRemove && status !== 'uploading' && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default FilePreview;
