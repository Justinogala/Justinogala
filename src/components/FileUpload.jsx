import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { validateFile } from '@/services/fileValidation';
import { fileService } from '@/services/fileService';

const FileUpload = ({ 
  bucket = 'documents', 
  fileType = 'document', // 'audio', 'video', 'document', 'avatar'
  path = 'uploads',
  multiple = false,
  onUploadComplete,
  className 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const processFiles = useCallback((incomingFiles) => {
    const newFiles = Array.from(incomingFiles).map(file => {
      const validation = validateFile(file, fileType);
      return {
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: validation.valid ? 'pending' : 'error',
        error: validation.error,
        progress: 0
      };
    });

    if (multiple) {
      setFiles(prev => [...prev, ...newFiles]);
    } else {
      setFiles([newFiles[0]]);
    }
  }, [fileType, multiple]);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUpload = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setUploading(true);
    setProgress(0);

    // Upload files sequentially for the prototype
    for (let i = 0; i < pendingFiles.length; i++) {
      const fileWrapper = pendingFiles[i];
      
      setFiles(prev => prev.map(f => 
        f.id === fileWrapper.id ? { ...f, status: 'uploading' } : f
      ));

      const result = await fileService.uploadFile(
        fileWrapper.file, 
        bucket, 
        path, 
        (p) => {
          setFiles(prev => prev.map(f => 
            f.id === fileWrapper.id ? { ...f, progress: p } : f
          ));
        }
      );

      setFiles(prev => prev.map(f => 
        f.id === fileWrapper.id 
          ? { 
              ...f, 
              status: result.success ? 'success' : 'error', 
              error: result.error,
              data: result.data
            } 
          : f
      ));
    }

    setUploading(false);
    if (onUploadComplete) {
      onUploadComplete(files.filter(f => f.status === 'success'));
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ease-in-out",
          isDragging 
            ? "border-indigo-500 bg-indigo-50/10 scale-[1.01]" 
            : "border-border hover:border-indigo-400 hover:bg-slate-50/5",
          uploading ? "pointer-events-none opacity-50" : "",
          "bg-bg-secondary"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          className="hidden"
          multiple={multiple}
        />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
            <UploadCloud className={cn("w-8 h-8 text-indigo-500", isDragging && "animate-bounce")} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-text-primary">
              {isDragging ? "Drop files here" : "Click to upload or drag and drop"}
            </h3>
            <p className="text-sm text-text-secondary">
              {fileType === 'audio' && "MP3, WAV, M4A, OGG (Max 500MB)"}
              {fileType === 'video' && "MP4, MOV, AVI, MKV (Max 2GB)"}
              {fileType === 'document' && "PDF, DOCX, TXT, PPTX (Max 100MB)"}
              {fileType === 'avatar' && "JPG, PNG, GIF (Max 10MB)"}
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 space-y-3"
          >
            {files.map((fileWrapper) => (
              <motion.div
                key={fileWrapper.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  "relative flex items-center p-3 rounded-lg border bg-card/50 backdrop-blur-sm",
                  fileWrapper.status === 'error' ? "border-red-500/50" : "border-border"
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-100/10 flex items-center justify-center mr-3 shrink-0">
                  <File className="w-5 h-5 text-indigo-500" />
                </div>
                
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {fileWrapper.file.name}
                    </p>
                    <span className="text-xs text-text-secondary">
                      {(fileWrapper.file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  
                  {fileWrapper.status === 'uploading' && (
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${fileWrapper.progress}%` }}
                      />
                    </div>
                  )}
                  
                  {fileWrapper.status === 'error' && (
                    <p className="text-xs text-red-500 flex items-center mt-1">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {fileWrapper.error}
                    </p>
                  )}
                  
                  {fileWrapper.status === 'success' && (
                    <p className="text-xs text-green-500 flex items-center mt-1">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Upload complete
                    </p>
                  )}
                </div>

                <button
                  onClick={() => removeFile(fileWrapper.id)}
                  disabled={uploading && fileWrapper.status === 'uploading'}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </motion.div>
            ))}

            <div className="flex justify-end pt-2">
               <Button 
                 onClick={handleUpload}
                 disabled={uploading || files.filter(f => f.status === 'pending').length === 0}
                 className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
               >
                 {uploading ? (
                   <>
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                     Uploading...
                   </>
                 ) : (
                   "Start Upload"
                 )}
               </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;