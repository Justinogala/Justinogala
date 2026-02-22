
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UploadCloud, X } from 'lucide-react';
import FileUploadArea from './FileUploadArea';
import FilePreview from './FilePreview';
import UploadProgress from './UploadProgress';
import { useFileUpload } from '@/hooks/useFileUpload';

const UploadModal = ({ isOpen, onClose, onUploadComplete }) => {
  const {
    file,
    progress,
    uploadSpeed,
    status,
    error,
    selectFile,
    simulateUpload,
    reset
  } = useFileUpload();

  const handleClose = () => {
    if (status === 'uploading') return; // Prevent closing while uploading
    reset();
    onClose();
  };

  const handleUpload = async () => {
    if (!file) return;
    simulateUpload((uploadedFile) => {
        if (onUploadComplete) onUploadComplete(uploadedFile);
        setTimeout(() => {
            handleClose();
        }, 1000);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl rounded-2xl p-0 overflow-hidden">
        {/* Header with Gradient */}
        <div className="relative p-6 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 dark:from-violet-900/20 dark:to-fuchsia-900/20 border-b border-gray-100 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-violet-600" />
              Upload Media
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Upload audio or video files for AI transcription.
            </DialogDescription>
          </DialogHeader>
          <button 
            onClick={handleClose} 
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!file ? (
            <FileUploadArea onFileSelect={selectFile} error={error} />
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <FilePreview 
                file={file} 
                status={status}
                onRemove={status !== 'uploading' ? reset : null} 
              />
              
              {status === 'uploading' && (
                <UploadProgress progress={progress} speed={uploadSpeed} />
              )}

              {status === 'success' && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm text-center font-medium animate-in zoom-in">
                  File uploaded successfully! Processing started...
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800">
          <Button variant="ghost" onClick={handleClose} disabled={status === 'uploading'}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || status === 'uploading' || status === 'success'}
            className="bg-violet-600 hover:bg-violet-700 min-w-[100px]"
          >
            {status === 'uploading' ? 'Uploading...' : status === 'success' ? 'Done' : 'Start Upload'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
