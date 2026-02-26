import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { 
  Monitor, Camera, Mic, Square, Download, Trash2, Play, Pause, RotateCcw, Video, 
  Clock, HardDrive, Loader2, FolderOpen, Share2, Link, Copy, Check, X, Edit2, 
  ChevronDown, Users, Globe, UserPlus, Mail, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { teamService } from '@/services/teamService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const MAX_RECORDING_TIME = 30 * 60; // 30 minutes in seconds
const API_BASE = window.location.origin;

const DEFAULT_CATEGORIES = ['Uncategorized', 'Meetings', 'Tutorials', 'Presentations', 'Bug Reports', 'Personal'];

const QuickRecordPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Recording state
  const [recordingType, setRecordingType] = useState(null);
  const [includeMicrophone, setIncludeMicrophone] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Uncategorized');
  
  // Saved recordings state
  const [savedRecordings, setSavedRecordings] = useState([]);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filterCategory, setFilterCategory] = useState('All');
  
  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareRecording, setShareRecording] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editRecording, setEditRecording] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const livePreviewRef = useRef(null);

  const userId = user?.id || 'anonymous';

  // Format helpers
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getDaysRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Fetch recordings and categories
  const fetchRecordings = useCallback(async () => {
    if (!userId || userId === 'anonymous') {
      setIsLoadingRecordings(false);
      return;
    }
    
    try {
      const [recResponse, catResponse] = await Promise.all([
        fetch(`${API_BASE}/api/recordings/${userId}`),
        fetch(`${API_BASE}/api/recordings/user/${userId}/categories`)
      ]);
      
      if (recResponse.ok) {
        const data = await recResponse.json();
        setSavedRecordings(data.recordings || []);
      }
      
      if (catResponse.ok) {
        const data = await catResponse.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching recordings:', err);
    } finally {
      setIsLoadingRecordings(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [cleanup, previewUrl]);

  // Recording functions
  const startRecording = async () => {
    if (!recordingType) {
      toast({ variant: "destructive", title: "Select recording type", description: "Please choose Screen or Camera." });
      return;
    }

    try {
      cleanup();
      chunksRef.current = [];
      setSelectedRecording(null);
      
      let stream;
      
      if (recordingType === 'screen') {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always', displaySurface: 'monitor' },
          audio: false
        });
        
        if (includeMicrophone) {
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({
              audio: { echoCancellation: true, noiseSuppression: true }
            });
            stream = new MediaStream([...screenStream.getVideoTracks(), ...audioStream.getAudioTracks()]);
            screenStream.getVideoTracks()[0].onended = () => {
              audioStream.getTracks().forEach(track => track.stop());
              stopRecording();
            };
          } catch {
            stream = screenStream;
          }
        } else {
          stream = screenStream;
        }
        screenStream.getVideoTracks()[0].onended = () => stopRecording();
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: includeMicrophone ? { echoCancellation: true, noiseSuppression: true } : false
        });
      }
      
      streamRef.current = stream;
      
      // Set recording state FIRST so the video element renders
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      setRecordedBlob(null);
      setPreviewUrl(null);
      
      // Use setTimeout to ensure the video element is rendered before attaching stream
      setTimeout(() => {
        if (livePreviewRef.current) {
          livePreviewRef.current.srcObject = stream;
          livePreviewRef.current.play().catch(e => console.log('Auto-play prevented:', e));
        }
      }, 100);
      
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
      const mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data?.size > 0) chunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        streamRef.current?.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME - 1) { stopRecording(); return prev; }
          return prev + 1;
        });
      }, 1000);
      
      toast({ title: "Recording started" });
    } catch (err) {
      console.error('Recording error:', err);
      cleanup();
      toast({ variant: "destructive", title: "Recording failed", description: err.name === 'NotAllowedError' ? "Permission denied." : "Could not start recording." });
    }
  };

  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setIsPaused(false);
    if (livePreviewRef.current) livePreviewRef.current.srcObject = null;
  }, []);

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => { if (prev >= MAX_RECORDING_TIME - 1) { stopRecording(); return prev; } return prev + 1; });
      }, 1000);
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPaused(true);
    }
  };

  const saveRecording = async () => {
    if (!recordedBlob || userId === 'anonymous') {
      toast({ variant: "destructive", title: "Please log in to save recordings." });
      return;
    }
    
    setIsSaving(true);
    try {
      const reader = new FileReader();
      const base64Data = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(recordedBlob);
      });
      
      const response = await fetch(`${API_BASE}/api/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          title: `Recording ${new Date().toLocaleString()}`,
          recording_type: recordingType,
          duration: recordingTime,
          file_data: base64Data,
          mime_type: recordedBlob.type || 'video/webm',
          category: selectedCategory
        })
      });
      
      if (response.ok) {
        toast({ title: "Recording saved", description: "Available for 7 days." });
        await fetchRecordings();
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setRecordedBlob(null);
        setPreviewUrl(null);
        setRecordingTime(0);
        setRecordingType(null);
      } else throw new Error('Failed to save');
    } catch (err) {
      console.error('Error saving:', err);
      toast({ variant: "destructive", title: "Save failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const downloadRecording = () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `munal-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Download started" });
  };

  const discardRecording = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRecordedBlob(null);
    setPreviewUrl(null);
    setRecordingTime(0);
    setRecordingType(null);
  };

  const recordAgain = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRecordedBlob(null);
    setPreviewUrl(null);
    setRecordingTime(0);
  };

  // Play saved recording
  const playSavedRecording = async (recording) => {
    if (selectedRecording?.id === recording.id) { setSelectedRecording(null); return; }
    
    setIsLoadingVideo(true);
    setSelectedRecording(recording);
    
    try {
      const response = await fetch(`${API_BASE}/api/recordings/${userId}/${recording.id}`);
      if (response.ok) {
        const data = await response.json();
        const byteCharacters = atob(data.file_data);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteArray[i] = byteCharacters.charCodeAt(i);
        const blob = new Blob([byteArray], { type: data.mime_type });
        setSelectedRecording({ ...recording, videoUrl: URL.createObjectURL(blob) });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Could not load recording." });
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const deleteSavedRecording = async (recording) => {
    try {
      const response = await fetch(`${API_BASE}/api/recordings/${userId}/${recording.id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Recording deleted" });
        setSavedRecordings(prev => prev.filter(r => r.id !== recording.id));
        if (selectedRecording?.id === recording.id) setSelectedRecording(null);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Could not delete recording." });
    }
  };

  // Download saved recording
  const downloadSavedRecording = async (recording) => {
    toast({ title: "Preparing download...", description: "Please wait while we fetch your recording." });
    
    try {
      const response = await fetch(`${API_BASE}/api/recordings/${userId}/${recording.id}`);
      if (response.ok) {
        const data = await response.json();
        
        // Convert base64 to blob
        const byteCharacters = atob(data.file_data);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: data.mime_type || 'video/webm' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${recording.title.replace(/[^a-z0-9]/gi, '_')}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({ title: "Download started", description: "Your recording is being downloaded." });
      } else {
        throw new Error('Failed to fetch recording');
      }
    } catch (err) {
      console.error('Download error:', err);
      toast({ variant: "destructive", title: "Download failed", description: "Could not download recording." });
    }
  };

  // Share functions
  const openShareDialog = (recording) => {
    setShareRecording(recording);
    setShareLink(recording.share_token ? `${window.location.origin}/shared/recording/${recording.share_token}` : '');
    setShareDialogOpen(true);
  };

  const generateShareLink = async () => {
    if (!shareRecording) return;
    setIsSharing(true);
    try {
      const response = await fetch(`${API_BASE}/api/recordings/${userId}/${shareRecording.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: true, share_with_users: [] })
      });
      if (response.ok) {
        const data = await response.json();
        const newLink = `${window.location.origin}${data.share_url}`;
        setShareLink(newLink);
        await fetchRecordings();
        toast({ title: "Share link generated!" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to generate link" });
    } finally {
      setIsSharing(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast({ title: "Link copied!" });
  };

  const removeSharing = async () => {
    if (!shareRecording) return;
    try {
      await fetch(`${API_BASE}/api/recordings/${userId}/${shareRecording.id}/share`, { method: 'DELETE' });
      setShareLink('');
      await fetchRecordings();
      toast({ title: "Sharing removed" });
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to remove sharing" });
    }
  };

  // Edit functions
  const openEditDialog = (recording) => {
    setEditRecording(recording);
    setEditTitle(recording.title);
    setEditCategory(recording.category || 'Uncategorized');
    setEditDialogOpen(true);
  };

  const saveEdit = async () => {
    if (!editRecording) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`${API_BASE}/api/recordings/${userId}/${editRecording.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, category: editCategory })
      });
      if (response.ok) {
        await fetchRecordings();
        setEditDialogOpen(false);
        toast({ title: "Recording updated" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to update" });
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter recordings
  const filteredRecordings = filterCategory === 'All' 
    ? savedRecordings 
    : savedRecordings.filter(r => (r.category || 'Uncategorized') === filterCategory);

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      <Helmet><title>Quick Record | Munal</title></Helmet>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Video className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Quick Record</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recording Section */}
        <div className="lg:col-span-2">
          <motion.div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            
            {/* Preview Area */}
            <AnimatePresence mode="wait">
              {(isRecording || previewUrl || selectedRecording?.videoUrl) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }} 
                  className="bg-gray-900 relative"
                >
                  {isRecording && (
                    <video 
                      ref={livePreviewRef} 
                      autoPlay 
                      muted 
                      playsInline 
                      className="w-full aspect-video object-contain bg-black"
                    />
                  )}
                  {previewUrl && !isRecording && (
                    <video 
                      src={previewUrl} 
                      controls 
                      className="w-full aspect-video object-contain" 
                    />
                  )}
                  {selectedRecording?.videoUrl && !isRecording && !previewUrl && (
                    <video 
                      src={selectedRecording.videoUrl} 
                      controls 
                      autoPlay 
                      className="w-full aspect-video object-contain" 
                    />
                  )}
                  
                  {/* Live Recording Indicator */}
                  {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full shadow-lg">
                        <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                        <span className="text-white text-sm font-semibold">LIVE</span>
                      </div>
                      <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <Clock className="w-4 h-4 text-white" />
                        <span className="text-white text-sm font-medium tabular-nums">{formatTime(recordingTime)}</span>
                      </div>
                      {isPaused && (
                        <div className="flex items-center gap-2 bg-yellow-500 px-3 py-1.5 rounded-full">
                          <Pause className="w-4 h-4 text-black" />
                          <span className="text-black text-sm font-semibold">PAUSED</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Recording Type Badge */}
                  {isRecording && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      {recordingType === 'screen' ? (
                        <><Monitor className="w-4 h-4 text-blue-400" /><span className="text-white text-sm">Screen</span></>
                      ) : (
                        <><Camera className="w-4 h-4 text-purple-400" /><span className="text-white text-sm">Camera</span></>
                      )}
                    </div>
                  )}
                  
                  {isLoadingVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-8">
              {/* Recording Setup */}
              {!isRecording && !previewUrl && !selectedRecording?.videoUrl && (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Record Your Video</h2>
                    <p className="text-gray-500 dark:text-gray-400">Choose how you&apos;d like to record</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button onClick={() => setRecordingType('screen')} data-testid="record-screen-btn" className={cn("flex flex-col items-center justify-center p-8 rounded-xl border-2 transition-all", recordingType === 'screen' ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300")}>
                      <Monitor className={cn("w-10 h-10 mb-4", recordingType === 'screen' ? "text-rose-600" : "text-gray-400")} />
                      <span className={cn("font-semibold mb-1", recordingType === 'screen' ? "text-rose-600" : "text-gray-700 dark:text-gray-300")}>Screen</span>
                      <span className="text-sm text-gray-500">Share your screen</span>
                    </button>
                    <button onClick={() => setRecordingType('camera')} data-testid="record-camera-btn" className={cn("flex flex-col items-center justify-center p-8 rounded-xl border-2 transition-all", recordingType === 'camera' ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300")}>
                      <Camera className={cn("w-10 h-10 mb-4", recordingType === 'camera' ? "text-rose-600" : "text-gray-400")} />
                      <span className={cn("font-semibold mb-1", recordingType === 'camera' ? "text-rose-600" : "text-gray-700 dark:text-gray-300")}>Camera</span>
                      <span className="text-sm text-gray-500">Use your webcam</span>
                    </button>
                  </div>

                  {/* Category Selection */}
                  <div className="mb-6">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Category</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          <span className="flex items-center gap-2">
                            <FolderOpen className="w-4 h-4" />
                            {selectedCategory}
                          </span>
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        {DEFAULT_CATEGORIES.map(cat => (
                          <DropdownMenuItem key={cat} onClick={() => setSelectedCategory(cat)}>
                            {cat}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Microphone */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-8 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start gap-3">
                      <Checkbox id="microphone" checked={includeMicrophone} onCheckedChange={setIncludeMicrophone} className="mt-0.5 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500" />
                      <div>
                        <label htmlFor="microphone" className="font-medium text-gray-900 dark:text-white cursor-pointer flex items-center gap-2">
                          <Mic className="w-4 h-4" /> Include microphone audio
                        </label>
                        <p className="text-sm text-gray-500 mt-1">Recommended for explanations and narration.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Recording Controls */}
              {isRecording && (
                <div className="flex items-center justify-center gap-4 py-4">
                  <Button onClick={togglePause} variant="outline" size="lg" className="gap-2">
                    {isPaused ? <><Play className="w-4 h-4" /> Resume</> : <><Pause className="w-4 h-4" /> Pause</>}
                  </Button>
                  <Button onClick={stopRecording} variant="destructive" size="lg" className="gap-2 bg-rose-500 hover:bg-rose-600">
                    <Square className="w-4 h-4" /> Stop Recording
                  </Button>
                </div>
              )}

              {/* Post-Recording */}
              {previewUrl && !isRecording && (
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <Button onClick={saveRecording} disabled={isSaving} className="gap-2 bg-rose-500 hover:bg-rose-600" size="lg">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                      {isSaving ? 'Saving...' : 'Save Recording'}
                    </Button>
                    <Button onClick={downloadRecording} variant="outline" size="lg" className="gap-2"><Download className="w-4 h-4" /> Download</Button>
                    <Button onClick={recordAgain} variant="outline" size="lg" className="gap-2"><RotateCcw className="w-4 h-4" /> Record Again</Button>
                    <Button onClick={discardRecording} variant="ghost" size="lg" className="gap-2 text-gray-500 hover:text-red-500"><Trash2 className="w-4 h-4" /> Discard</Button>
                  </div>
                  <p className="text-center text-sm text-gray-500">Duration: {formatTime(recordingTime)} • Expires in 7 days</p>
                </div>
              )}

              {selectedRecording?.videoUrl && !isRecording && !previewUrl && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Playing: {selectedRecording.title}</p>
                  <Button onClick={() => setSelectedRecording(null)} variant="outline" size="sm" className="mt-2">Close Player</Button>
                </div>
              )}

              {!isRecording && !previewUrl && !selectedRecording?.videoUrl && (
                <>
                  <Button onClick={startRecording} disabled={!recordingType} className={cn("w-full h-12 text-base font-medium gap-2 transition-all", recordingType ? "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-500/25" : "bg-rose-300 cursor-not-allowed")}>
                    <div className="w-3 h-3 rounded-full bg-white/80" /> Start Recording
                  </Button>
                  <p className="text-center text-sm text-gray-400 mt-4">Maximum recording time: 30 minutes</p>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Saved Recordings Sidebar */}
        <div className="lg:col-span-1">
          <motion.div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4" /> Saved Recordings
                </h3>
              </div>
              
              {/* Category Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                    <span className="flex items-center gap-1.5"><FolderOpen className="w-3 h-3" /> {filterCategory}</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem onClick={() => setFilterCategory('All')}>All Categories</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {categories.map(cat => (
                    <DropdownMenuItem key={cat.name} onClick={() => setFilterCategory(cat.name)}>
                      {cat.name} ({cat.count})
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <p className="text-xs text-gray-500 mt-2">Auto-deleted after 7 days</p>
            </div>

            <div className="max-h-[450px] overflow-y-auto">
              {isLoadingRecordings ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-gray-400 animate-spin" /></div>
              ) : filteredRecordings.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Video className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No recordings yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredRecordings.map((recording) => (
                    <div key={recording.id} className={cn("p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors", selectedRecording?.id === recording.id && "bg-rose-50 dark:bg-rose-950/20")}>
                      <div className="flex items-start gap-3">
                        <button onClick={() => playSavedRecording(recording)} className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", recording.recording_type === 'screen' ? "bg-blue-100 dark:bg-blue-900/30" : "bg-purple-100 dark:bg-purple-900/30")}>
                          {recording.recording_type === 'screen' ? <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <Camera className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                        </button>
                        
                        <div className="flex-1 min-w-0" onClick={() => playSavedRecording(recording)}>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate cursor-pointer">{recording.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(recording.duration)}</span>
                            <span>{formatFileSize(recording.file_size)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">{recording.category || 'Uncategorized'}</span>
                            {recording.is_shared && <span className="text-xs bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded text-green-600 dark:text-green-400 flex items-center gap-1"><Globe className="w-3 h-3" />Shared</span>}
                            <span className={cn("text-xs px-1.5 py-0.5 rounded", getDaysRemaining(recording.expires_at) <= 2 ? "bg-red-100 text-red-600 dark:bg-red-900/30" : "bg-gray-100 text-gray-500 dark:bg-gray-800")}>{getDaysRemaining(recording.expires_at)}d left</span>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8"><ChevronDown className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => playSavedRecording(recording)}><Play className="w-4 h-4 mr-2" />Play</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadSavedRecording(recording)}><Download className="w-4 h-4 mr-2" />Download</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditDialog(recording)}><Edit2 className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openShareDialog(recording)}><Share2 className="w-4 h-4 mr-2" />Share</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => deleteSavedRecording(recording)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Share2 className="w-5 h-5" />Share Recording</DialogTitle>
            <DialogDescription>Generate a public link to share this recording with anyone.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {shareLink ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input value={shareLink} readOnly className="flex-1 text-sm" />
                  <Button onClick={copyShareLink} variant="outline" size="icon">
                    {linkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <Button onClick={removeSharing} variant="ghost" size="sm" className="text-red-500 w-full">
                  <X className="w-4 h-4 mr-2" /> Remove Sharing
                </Button>
              </div>
            ) : (
              <Button onClick={generateShareLink} disabled={isSharing} className="w-full gap-2">
                {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                Generate Share Link
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit2 className="w-5 h-5" />Edit Recording</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Recording title" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2"><FolderOpen className="w-4 h-4" />{editCategory}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {DEFAULT_CATEGORIES.map(cat => (
                    <DropdownMenuItem key={cat} onClick={() => setEditCategory(cat)}>{cat}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuickRecordPage;
