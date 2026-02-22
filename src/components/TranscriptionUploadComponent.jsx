
import React, { useState, useCallback } from 'react';
import { Upload, X, FileAudio, AlertCircle, Settings, ArrowRight, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { transcriptionService } from '@/services/transcriptionService';
import { useAPIKeyManagement } from '@/hooks/useAPIKeyManagement';
import { useNavigate } from 'react-router-dom';

const MAX_SIZE_MB = 25; // Whisper limit

const TranscriptionUploadComponent = ({ onTranscriptionComplete }) => {
  const navigate = useNavigate();
  const { isValid: hasValidKey } = useAPIKeyManagement();
  
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState('en');
  const [status, setStatus] = useState('idle'); // idle, processing, saving, completed, failed
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0); 
  const { toast } = useToast();

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file) => {
    setError('');
    if (!file) return false;
    if (!file.name.match(/\.(mp3|wav|mp4|m4a|ogg|webm|mpeg)$/i)) {
      setError('Unsupported file format. Please use MP3, WAV, MP4, M4A, OGG, or WEBM.');
      return false;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File size exceeds Munal AI Whisper limit of ${MAX_SIZE_MB}MB.`);
      return false;
    }
    return true;
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) setFile(droppedFile);
    }
  }, []);

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) setFile(selectedFile);
    }
  };

  const handleStart = async () => {
    if (!file) return;
    if (!hasValidKey) {
      setError('Munal AI API Key is missing. Please configure it below.');
      return;
    }

    setStatus('processing');
    setError('');
    setProgress(0);

    try {
      // Fake progress
      const progressInterval = setInterval(() => {
        setProgress(old => (old >= 90 ? 90 : old + 5));
      }, 500);

      // 1. Create Transcription (Upload + Transcribe)
      const result = await transcriptionService.createTranscription(file, { language });
      
      clearInterval(progressInterval);
      setProgress(95);
      setStatus('saving');

      // 2. Save to History explicitly
      const savedRecord = await transcriptionService.saveTranscription(result);
      
      setProgress(100);
      setStatus('completed');
      
      toast({
        title: "Success",
        description: "Transcription saved to history."
      });

      if (onTranscriptionComplete) {
        onTranscriptionComplete(savedRecord);
      }

    } catch (err) {
      console.error(err);
      setStatus('failed');
      setError(err.message || 'Something went wrong during transcription.');
      toast({
        title: "Transcription Failed",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const reset = () => {
    setFile(null);
    setStatus('idle');
    setError('');
    setProgress(0);
  };

  if (!hasValidKey) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
        <Settings className="w-8 h-8 text-amber-600 mx-auto mb-2" />
        <h3 className="text-lg font-semibold mb-2">Munal AI API Key Required</h3>
        <Button onClick={() => navigate('/settings/api-keys')} variant="outline">Configure API Key</Button>
      </div>
    );
  }

  if (status !== 'idle') {
    return (
      <div className="w-full max-w-xl mx-auto space-y-6 text-center p-8 border rounded-xl bg-white dark:bg-slate-900 shadow-sm">
        {(status === 'processing' || status === 'saving') && (
          <div className="space-y-4">
            <Loader2 className="w-16 h-16 animate-spin text-indigo-600 mx-auto" />
            <h3 className="text-xl font-semibold">
              {status === 'processing' ? 'Transcribing with Whisper...' : 'Saving to history...'}
            </h3>
            <div className="w-full bg-gray-100 rounded-full h-2.5 dark:bg-gray-700 max-w-xs mx-auto">
              <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}
        
        {status === 'completed' && (
          <div className="space-y-4">
             <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
               <ArrowRight className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-semibold text-green-600">Transcription Complete!</h3>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-4">
             <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
               <X className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-semibold text-red-600">Failed</h3>
             <p className="text-red-500">{error}</p>
             <Button onClick={reset} variant="outline">Try Again</Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div 
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center text-center",
          dragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400",
          file ? "bg-white" : ""
        )}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
      >
        {!file ? (
          <>
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Drag & Drop audio file</h3>
            <p className="text-gray-500 text-sm mb-6">MP3, WAV, M4A, OGG, WEBM. Max 25MB.</p>
            <div className="relative">
              <input id="file-upload" type="file" className="hidden" accept=".mp3,.wav,.mp4,.m4a,.ogg,.flac,.webm" onChange={handleChange} />
              <Button asChild variant="outline" className="cursor-pointer">
                <label htmlFor="file-upload">Browse Files</label>
              </Button>
            </div>
          </>
        ) : (
          <div className="w-full flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded">
                <FileAudio className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-left">
                <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={reset}><X className="w-5 h-5" /></Button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="w-full sm:w-1/2 space-y-2">
          <label className="text-sm font-medium">Language</label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger><SelectValue placeholder="Select Language" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-1/2">
          <Button onClick={handleStart} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
            Start Transcription
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionUploadComponent;
