import React, { useState, useRef } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Upload, FileAudio, X, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { transcribeAudio } from '@/services/transcriptionService';
import { useAuth } from '@/context/AuthContext';

const AudioUploadModal = ({ isOpen, onClose, onUploadComplete }) => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const acceptedFileTypes = ['.mp3', '.wav', '.m4a', '.mp4'];
  const maxFileSize = 100 * 1024 * 1024; // 100MB

  const handleClose = () => {
    if (processingStatus && processingStatus !== 'success' && processingStatus !== 'error') return;
    setSelectedFile(null);
    setUploadProgress(0);
    setProcessingStatus(null);
    setErrorMessage('');
    setIsDragging(false);
    onClose();
  };

  const handleFileSelect = (file) => {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      setErrorMessage(`Invalid file type. Allowed: ${acceptedFileTypes.join(', ')}`);
      return;
    }
    if (file.size > maxFileSize) {
      setErrorMessage('File size exceeds 100MB limit.');
      return;
    }
    setSelectedFile(file);
    setErrorMessage('');
    toast({ title: "Upload Successful", description: "File selected." });
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
  };
  const removeFile = () => { setSelectedFile(null); setErrorMessage(''); };

  const processMeeting = async () => {
    if (!selectedFile || !user) return;

    try {
      setProcessingStatus('processing');
      setUploadProgress(10);

      const interval = setInterval(() => {
        setUploadProgress(p => p < 90 ? p + 10 : 90);
      }, 300);

      // Using the updated transcriptionService which now uses AssemblyAI
      await transcribeAudio(selectedFile);

      clearInterval(interval);
      setUploadProgress(100);
      setProcessingStatus('success');

      toast({
        title: "Success",
        description: "Transcription completed successfully.",
      });

      if (onUploadComplete) onUploadComplete();
      setTimeout(handleClose, 1500);

    } catch (error) {
      console.error(error);
      setProcessingStatus('error');
      setErrorMessage(error.message);
      toast({
        title: "Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Meeting Recording">
      <div className="space-y-6">
        {!processingStatus && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
              isDragging ? "border-indigo-500 bg-indigo-500/10" : "border-white/20 bg-white/5",
              "hover:border-indigo-500/50 hover:bg-white/10 cursor-pointer"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-indigo-400" />
            <p className="text-lg font-medium text-white mb-2">
              {isDragging ? 'Drop your file here' : 'Drag and drop your audio file'}
            </p>
            <p className="text-xs text-gray-500 mb-4">MP3, WAV, M4A, MP4 (Max 100MB)</p>
            <input ref={fileInputRef} type="file" accept={acceptedFileTypes.join(',')} onChange={handleFileInputChange} className="hidden" />
          </div>
        )}

        {selectedFile && !processingStatus && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
            <FileAudio className="w-8 h-8 text-indigo-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button onClick={removeFile} className="p-1 hover:bg-white/10 rounded"><X className="w-5 h-5 text-gray-400" /></button>
          </div>
        )}

        {processingStatus && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span className="capitalize">{processingStatus === 'processing' ? 'Transcribing...' : processingStatus + '...'}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${uploadProgress}%` }} />
            </div>
            {processingStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                <CheckCircle className="w-4 h-4" /> Upload successful!
              </div>
            )}
            {processingStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                <AlertCircle className="w-4 h-4" /> {errorMessage}
              </div>
            )}
          </div>
        )}

        {!processingStatus && (
          <div className="flex gap-3 pt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1">Cancel</Button>
            <Button onClick={processMeeting} disabled={!selectedFile} className="flex-1">Start Processing</Button>
          </div>
        )}
        {processingStatus === 'error' && (
          <div className="flex gap-3 pt-4">
            <Button onClick={() => { setProcessingStatus(null); setErrorMessage(''); }} variant="outline" className="flex-1">Retry</Button>
            <Button onClick={handleClose} className="flex-1">Close</Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AudioUploadModal;