import React, { useRef, useState } from 'react';
import { Paperclip, FileText, X, UploadCloud, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFileService } from '@/services/uploadFileService';
import { useToast } from '@/components/ui/use-toast';

const FileUploadHandler = ({ onUploadComplete, onCancel }) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 50MB Limit
      if (file.size > 50 * 1024 * 1024) {
        toast({ 
          variant: 'destructive', 
          title: 'File too large', 
          description: 'Max file size is 50MB' 
        });
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadFileService.uploadFile(selectedFile, 'documents', (progress) => {
        setUploadProgress(progress);
      });

      if (result.success) {
        onUploadComplete({
          type: 'file',
          file: result.data,
          url: result.data.url,
          name: selectedFile.name,
          size: selectedFile.size,
          mimeType: selectedFile.type,
          uploadedAt: new Date().toISOString()
        });
        clearSelection();
      } else {
        toast({ variant: 'destructive', title: 'Upload Failed', description: result.error });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Unexpected upload error' });
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onCancel && onCancel();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.csv,.ppt,.pptx"
      />
      
      {!selectedFile ? (
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-500 hover:text-indigo-600 rounded-full"
          title="Attach File"
        >
          <Paperclip className="w-5 h-5" />
        </Button>
      ) : (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-full left-0 mb-4 p-4 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-slate-800 z-50"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={clearSelection} disabled={isUploading} className="text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {isUploading ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1.5" />
              </div>
            ) : (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={clearSelection}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={handleUpload}
                >
                  <UploadCloud className="w-3 h-3 mr-2" /> Upload
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
};

export default FileUploadHandler;