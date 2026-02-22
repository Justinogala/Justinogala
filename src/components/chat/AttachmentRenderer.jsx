import React, { useState } from 'react';
import { FileText, File, Download, Music, Video, Play, ExternalLink, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ImagePreviewComponent from './ImagePreviewComponent';

const AttachmentRenderer = ({ attachment, className }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  if (!attachment) return null;

  const { type, url, name, size, mimeType } = attachment;

  const formatSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // 1. Image Renderer
  if (type === 'image' || mimeType?.startsWith('image/')) {
    return (
      <ImagePreviewComponent 
        src={url} 
        alt={name} 
        metadata={{ name, size }} 
        className={className} 
      />
    );
  }

  // 2. Video Renderer
  if (type === 'video' || mimeType?.startsWith('video/')) {
    return (
      <div className={cn("relative group max-w-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black", className)}>
         <video src={url} className="w-full max-h-[300px]" controls />
         <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <a href={url} download={name} className="p-1.5 bg-black/50 text-white rounded-full block hover:bg-black/70">
              <Download className="w-4 h-4" />
            </a>
         </div>
      </div>
    );
  }

  // 3. Audio Renderer
  if (type === 'audio' || mimeType?.startsWith('audio/') || type === 'voice') {
    return (
      <div className={cn("flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 min-w-[250px]", className)}>
        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400">
          <Music className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate mb-1">{name || 'Audio Message'}</div>
          <audio src={url} controls className="h-6 w-full max-w-[200px]" />
        </div>
      </div>
    );
  }

  // 4. Generic File Renderer (PDF, Doc, etc.)
  const isPDF = mimeType === 'application/pdf' || name?.endsWith('.pdf');
  const Icon = isPDF ? FileText : File;

  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow max-w-xs", className)}>
      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-gray-500 dark:text-gray-400">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate text-gray-900 dark:text-gray-100" title={name}>{name}</div>
        <div className="text-xs text-gray-500">{formatSize(size)} • {mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}</div>
      </div>
      <a 
        href={url} 
        download={name} 
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        title="Download"
      >
        <Download className="w-4 h-4" />
      </a>
    </div>
  );
};

export default AttachmentRenderer;