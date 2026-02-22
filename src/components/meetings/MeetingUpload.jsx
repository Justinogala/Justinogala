
import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileVideo, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { localMeetingsStorageService } from '@/services/localMeetingsStorageService';
import { v4 as uuidv4 } from 'uuid';

const MeetingUpload = ({ onUploadComplete, onCancel }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metadata, setMetadata] = useState({
    title: '',
    participants: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  const inputRef = useRef(null);
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
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB

    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload MP4, WebM, MOV, or AVI.", variant: "destructive" });
      return false;
    }
    if (file.size > maxSize) {
      toast({ title: "File too large", description: "Max file size is 2GB.", variant: "destructive" });
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
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        if (!metadata.title) {
          setMetadata(prev => ({...prev, title: droppedFile.name.replace(/\.[^/.]+$/, "")}));
        }
      }
    }
  }, [metadata.title, toast]);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        if (!metadata.title) {
          setMetadata(prev => ({...prev, title: selectedFile.name.replace(/\.[^/.]+$/, "")}));
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!file || !metadata.title) return;

    setUploading(true);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95;
        return prev + 5;
      });
    }, 200);

    try {
      // 1. Prepare Data
      const meetingId = uuidv4();
      const newMeeting = {
        id: meetingId,
        title: metadata.title,
        date: metadata.date,
        participants: metadata.participants.split(',').map(p => p.trim()).filter(Boolean),
        notes: metadata.notes,
        duration: 0, // In real app, calculate from video metadata
        hasRecording: true,
        createdAt: new Date().toISOString()
      };

      // 2. Save to Local Storage / IndexedDB (since Supabase is not connected in this context)
      // If we had Supabase connected, we'd use meetingsService.uploadRecording here too
      await localMeetingsStorageService.saveMeeting(newMeeting, file);

      clearInterval(interval);
      setProgress(100);
      
      setTimeout(() => {
        setUploading(false);
        onUploadComplete(newMeeting);
        toast({
          title: "Upload Successful",
          description: "Meeting recording saved successfully.",
        });
      }, 500);

    } catch (error) {
      clearInterval(interval);
      setUploading(false);
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-slate-900 shadow-xl border-violet-100 dark:border-violet-900">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-600">
          Upload Meeting Recording
        </h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {!file ? (
        <div 
          className={cn(
            "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer min-h-[300px]",
            dragActive ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20" : "border-slate-300 dark:border-slate-700 hover:border-violet-400"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input 
            ref={inputRef}
            type="file" 
            className="hidden" 
            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
            onChange={handleChange}
          />
          <div className="w-20 h-20 bg-violet-100 dark:bg-violet-900/40 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-10 h-10 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Drag & drop video file here
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Supported formats: MP4, WebM, MOV, AVI (Max 2GB)
          </p>
          <Button variant="outline" className="border-violet-200 text-violet-700 hover:bg-violet-50">
            Browse Files
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
              <FileVideo className="w-6 h-6 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setFile(null)} disabled={uploading}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Meeting Title" 
                placeholder="e.g. Weekly Sync"
                value={metadata.title}
                onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                required
              />
              <Input 
                type="date"
                label="Date"
                value={metadata.date}
                onChange={(e) => setMetadata({...metadata, date: e.target.value})}
              />
            </div>
            <Input 
              label="Participants (comma separated)" 
              placeholder="e.g. John, Sarah, Mike"
              value={metadata.participants}
              onChange={(e) => setMetadata({...metadata, participants: e.target.value})}
            />
            <Textarea 
              placeholder="Initial notes or agenda..."
              className="min-h-[100px]"
              value={metadata.notes}
              onChange={(e) => setMetadata({...metadata, notes: e.target.value})}
            />
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={onCancel} disabled={uploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={uploading || !metadata.title}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {uploading ? 'Processing...' : 'Upload & Save'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MeetingUpload;
