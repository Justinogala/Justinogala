import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { uploadFileService } from '@/services/uploadFileService';
import { Upload, X, File, FileAudio, FileVideo, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const FileUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});

  useEffect(() => {
    if (isOpen) {
      setSelectedFiles([]);
      setUploadProgress({});
      setUploadStatus({});
      setIsUploading(false);
    }
  }, [isOpen]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[index];
      return newStatus;
    });
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('audio/')) return <FileAudio className="w-8 h-8 text-pink-500" />;
    if (file.type.startsWith('video/')) return <FileVideo className="w-8 h-8 text-blue-500" />;
    return <File className="w-8 h-8 text-emerald-500" />;
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let failedCount = 0;
    const uploadedFiles = [];

    const uploadPromises = selectedFiles.map(async (file, index) => {
      if (uploadStatus[index] === 'success') return;

      setUploadStatus(prev => ({ ...prev, [index]: 'uploading' }));
      
      try {
        const result = await uploadFileService.uploadFile(file, 'documents', (progress) => {
          setUploadProgress(prev => ({ ...prev, [index]: progress }));
        });

        if (result.success) {
          setUploadStatus(prev => ({ ...prev, [index]: 'success' }));
          successCount++;
          uploadedFiles.push(file);
        } else {
          setUploadStatus(prev => ({ ...prev, [index]: 'error' }));
          failedCount++;
        }
      } catch (err) {
        setUploadStatus(prev => ({ ...prev, [index]: 'error' }));
        failedCount++;
      }
    });

    await Promise.all(uploadPromises);
    setIsUploading(false);

    if (successCount > 0) {
      toast({
        title: "Success",
        description: `${successCount} file(s) uploaded successfully`,
        className: "bg-green-600 text-white border-none"
      });
      
      if (onSuccess) onSuccess(uploadedFiles);
      
      if (failedCount === 0) {
        onClose();
      }
    } else if (failedCount > 0) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => !isUploading && onClose()} 
      title="Upload Files"
      className="max-w-xl"
    >
      <div className="space-y-6">
        {/* Upload Area */}
        <div 
          className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:bg-white/5 transition-colors cursor-pointer"
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-300 font-medium">Click to select files</p>
          <p className="text-xs text-gray-500 mt-1">Supports Documents, Audio, and Video (Max 100MB)</p>
        </div>

        {/* File List */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-3 bg-white/5 p-3 rounded-md border border-white/10">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{file.name}</p>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    {uploadStatus[index] === 'uploading' && <span>{uploadProgress[index] || 0}%</span>}
                  </div>
                  
                  {uploadStatus[index] === 'uploading' && (
                    <div className="w-full bg-gray-700 h-1 mt-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full transition-all duration-300" 
                        style={{ width: `${uploadProgress[index] || 0}%` }} 
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  {uploadStatus[index] === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : uploadStatus[index] === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : isUploading ? (
                     <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                      className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]"
          >
            {isUploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading</>
            ) : 'Upload'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FileUploadModal;