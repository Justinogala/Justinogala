
import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { X, ExternalLink, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const ImagePreviewComponent = ({ src, alt, metadata, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Fallback for missing metadata
  const fileSize = metadata?.size ? formatSize(metadata.size) : '';
  const fileName = metadata?.name || alt || 'Image';

  function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  return (
    <>
      <div 
        className={cn(
          "chat-image-container relative group cursor-zoom-in max-w-sm rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsOpen(true)}
      >
        <img 
          src={src} 
          alt={alt} 
          className="chat-image-preview block w-full h-auto max-h-[300px] object-cover"
          loading="lazy"
        />
        
        {/* Overlay with Metadata */}
        <div className="chat-image-overlay absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
          <div className="text-white text-xs font-medium truncate w-full shadow-sm drop-shadow-md">
            {fileName}
          </div>
          {fileSize && (
            <div className="text-white/80 text-[10px] shadow-sm drop-shadow-md">
              {fileSize}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl w-auto h-auto p-0 overflow-hidden bg-transparent border-none shadow-none flex flex-col items-center justify-center">
          <div className="relative group/modal">
            <img 
              src={src} 
              alt={alt} 
              className="max-h-[85vh] max-w-full rounded-md shadow-2xl object-contain"
            />
            
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/modal:opacity-100 transition-opacity">
               <Button
                 variant="secondary"
                 size="icon"
                 className="rounded-full h-9 w-9 bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border border-white/10"
                 onClick={(e) => {
                    e.stopPropagation();
                    const link = document.createElement('a');
                    link.href = src;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                 }}
                 title="Download"
               >
                 <Download className="w-4 h-4" />
               </Button>
               <Button
                 variant="secondary"
                 size="icon"
                 className="rounded-full h-9 w-9 bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border border-white/10"
                 onClick={() => setIsOpen(false)}
                 title="Close"
               >
                 <X className="w-4 h-4" />
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImagePreviewComponent;
