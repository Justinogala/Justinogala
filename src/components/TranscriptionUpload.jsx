
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, FileAudio, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { transcriptionService } from '@/services/transcriptionService';
import { webSpeechService } from '@/services/webSpeechService';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const TranscriptionUpload = ({ onSuccess }) => {
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState({ title: '', language: 'en', description: '' });
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    const supported = webSpeechService.isSupported();
    setIsSupported(supported);
    if (!supported) {
      toast({
        title: "Browser Not Supported",
        description: "Your browser does not support the Web Speech API required for transcription.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'video/mp4', 'video/webm'];
    const maxSize = 25 * 1024 * 1024; // 25MB

    if (!validTypes.includes(selectedFile.type) && !selectedFile.type.startsWith('audio/') && !selectedFile.type.startsWith('video/')) {
      toast({ title: "Invalid File", description: "Please upload an audio or video file.", variant: "destructive" });
      return;
    }

    if (selectedFile.size > maxSize) {
      toast({ title: "File too large", description: "Maximum file size is 25MB.", variant: "destructive" });
      return;
    }

    setFile(selectedFile);
    setMetadata(prev => ({ ...prev, title: selectedFile.name.split('.')[0] }));
    setStatus('idle');
    toast({ title: "Upload Successful", description: "File selected successfully." });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    if (!isSupported) {
        toast({ title: "Error", description: "Browser not supported.", variant: "destructive" });
        return;
    }

    setStatus('uploading');
    setProgress(0);

    const uploadInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return 90;
        return prev + 10;
      });
    }, 200);

    try {
      await transcriptionService.createTranscription(file, metadata);
      
      clearInterval(uploadInterval);
      setProgress(100);
      setStatus('completed');
      
      toast({
        title: "Success",
        description: "Transcription saved to history.",
      });
      
      if (onSuccess) onSuccess();

    } catch (error) {
      clearInterval(uploadInterval);
      setStatus('error');
      toast({
        title: "Transcription Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const resetForm = () => {
    setFile(null);
    setMetadata({ title: '', language: 'en', description: '' });
    setStatus('idle');
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isSupported) {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardContent className="pt-6 text-center text-red-800">
          <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-600" />
          <h3 className="font-bold text-lg">Browser Not Supported</h3>
          <p>Please use Google Chrome, Edge, or Safari to use the Web Speech API.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-gray-200 dark:border-gray-800 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-xl">New Transcription (Munal AI)</CardTitle>
        <Badge variant="secondary" className="text-xs font-normal">
            <ShieldCheck className="w-3 h-3 mr-1" /> Munal AI Powered
        </Badge>
      </CardHeader>
      <CardContent>
        {status === 'completed' ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Transcription Complete!</h3>
            <p className="text-gray-500 mb-6">Your file has been processed successfully by Munal AI.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={resetForm} variant="outline">Transcribe Another</Button>
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                <Link to="/transcriptions">View in History</Link>
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {!file ? (
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-10 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="audio/*,video/*"
                  onChange={handleFileSelect}
                />
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  Munal AI: Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supports state-of-the-art Whisper model: MP3, WAV, MP4, M4A
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 flex items-center justify-between border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600">
                    <FileAudio className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                {status === 'idle' && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setFile(null)} 
                    className="text-gray-500 hover:text-red-500"
                    type="button"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>
            )}

            {file && status !== 'error' && (
              <div className="space-y-4">
                {status === 'idle' && (
                  <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input 
                        id="title" 
                        value={metadata.title} 
                        onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                        placeholder="Transcription Title"
                        className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
                
                {(status === 'uploading' || status === 'processing') && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                      <span>{status === 'uploading' ? 'Munal AI Processing...' : 'Munal AI Transcribing...'}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 text-center pt-1">Using Munal AI state-of-the-art model...</p>
                  </div>
                )}

                {status === 'idle' && (
                  <div className="flex justify-end gap-3 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setFile(null)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
                    >
                      Transcribe with Munal AI
                    </Button>
                  </div>
                )}
              </div>
            )}
            {status === 'error' && (
               <div className="flex justify-center pt-2">
                   <Button variant="outline" onClick={() => { setStatus('idle'); setProgress(0); }}>Retry</Button>
               </div>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default TranscriptionUpload;
