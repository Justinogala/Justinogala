
import React, { useCallback, useState } from 'react';
import { Upload, FileAudio, FileVideo, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const FileUploadArea = ({ onFileSelect, error }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  }, [onFileSelect]);

  return (
    <div className="w-full space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ease-in-out text-center cursor-pointer overflow-hidden",
          isDragging 
            ? "border-violet-500 bg-violet-50/50 dark:bg-violet-900/20 scale-[1.01]" 
            : "border-gray-200 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-800/30 hover:bg-gray-50 dark:hover:bg-slate-800/50",
          error ? "border-red-300 bg-red-50/30" : ""
        )}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleChange}
          accept="audio/*,video/*,.pdf,.docx,.txt"
        />
        
        <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
          <div className={cn(
            "p-4 rounded-full transition-colors duration-300",
            isDragging ? "bg-violet-100 text-violet-600" : "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500"
          )}>
            <Upload className="w-8 h-8" />
          </div>
          
          <div className="space-y-1">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {isDragging ? "Drop file here" : "Click to upload or drag and drop"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Audio, Video, or Documents up to 500MB
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-400">
             <span className="flex items-center gap-1"><FileAudio className="w-3 h-3" /> MP3, WAV</span>
             <span className="flex items-center gap-1"><FileVideo className="w-3 h-3" /> MP4, AVI</span>
             <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> PDF, DOCX</span>
          </div>
        </div>

        {/* Gradient Overlay for visual flair */}
        <div className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-500",
          isDragging ? "opacity-100 bg-gradient-to-br from-violet-500/5 to-purple-500/5" : "opacity-0"
        )} />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUploadArea;
