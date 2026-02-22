
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Calendar, Clock, Download, Trash2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import TranscriptionStatusBadge from '@/components/TranscriptionStatusBadge';

const TranscriptionDetailModal = ({ transcription, isOpen, onClose, onDelete }) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !transcription) return null;

  const handleCopy = () => {
    if (transcription.transcribedText) {
      navigator.clipboard.writeText(transcription.transcribedText);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = (formatType = 'txt') => {
    const text = transcription.transcribedText || '';
    if (!text) return;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${transcription.fileName || 'transcription'}.${formatType}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Download started" });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center text-indigo-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                  {transcription.fileName || transcription.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {transcription.uploadDate ? format(new Date(transcription.uploadDate), 'MMM d, yyyy') : '-'}
                  </span>
                  <span>•</span>
                  <span>{transcription.fileSize}</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-slate-950/50">
             <div className="flex items-center justify-between mb-4">
                <TranscriptionStatusBadge status={transcription.status} />
                <div className="flex items-center gap-2">
                   <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                      {copied ? "Copied" : "Copy Text"}
                   </Button>
                   <Button variant="outline" size="sm" onClick={() => handleDownload('txt')}>
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Download TXT
                   </Button>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 min-h-[200px] whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300 font-mono">
                {transcription.transcribedText || transcription.text || (
                  <span className="text-gray-400 italic">No text content available. The transcription may still be processing.</span>
                )}
             </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 flex justify-between items-center">
             <div className="text-xs text-gray-400">
                ID: {transcription.id}
             </div>
             <Button 
               variant="destructive" 
               size="sm" 
               onClick={() => onDelete(transcription.id)}
               className="bg-red-50 text-red-600 hover:bg-red-100 border-red-100 hover:border-red-200"
             >
               <Trash2 className="w-4 h-4 mr-2" />
               Delete File
             </Button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TranscriptionDetailModal;
