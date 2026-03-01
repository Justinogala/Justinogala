import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { 
  Video, Sparkles, Download, RefreshCw, Play, Pause, 
  Loader2, AlertCircle, Settings2, Clock, Maximize, 
  Square, RectangleHorizontal, RectangleVertical, Film, ChevronDown,
  Save, History, Trash2, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

const API_URL = import.meta.env.REACT_APP_BACKEND_URL || '';

const TextToVideoPage = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoData, setVideoData] = useState(null);
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);
  
  // Settings
  const [model, setModel] = useState('sora-2');
  const [size, setSize] = useState('1280x720');
  const [duration, setDuration] = useState(4);
  
  // History
  const [videoHistory, setVideoHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Save dialog
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saving, setSaving] = useState(false);

  // Check service availability and load history
  useEffect(() => {
    const checkService = async () => {
      try {
        const res = await fetch(`${API_URL}/api/ai/video/status`);
        if (res.ok) {
          const data = await res.json();
          setServiceAvailable(data.available);
        }
      } catch {
        setServiceAvailable(false);
      }
    };
    checkService();
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/video/history?limit=10`);
      if (res.ok) {
        const data = await res.json();
        setVideoHistory(data.videos || []);
      }
    } catch (error) {
      console.error('Error loading video history:', error);
    }
    setHistoryLoading(false);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ variant: 'destructive', title: 'Please enter a prompt' });
      return;
    }

    setGenerating(true);
    setProgress(0);
    setVideoData(null);

    try {
      // Start the generation job
      const res = await fetch(`${API_URL}/api/ai/video/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model, size, duration })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to start video generation');
      }

      const startData = await res.json();
      const jobId = startData.job_id;
      
      if (!jobId) {
        throw new Error('No job ID received');
      }

      toast({ title: 'Video generation started', description: 'This may take a few minutes...' });

      // Poll for job status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_URL}/api/ai/video/job/${jobId}`);
          const statusData = await statusRes.json();
          
          if (statusData.status === 'completed') {
            clearInterval(pollInterval);
            setProgress(100);
            setVideoData(statusData);
            setGenerating(false);
            toast({ title: 'Video generated successfully!' });
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            setGenerating(false);
            throw new Error(statusData.error || 'Video generation failed');
          } else {
            // Update progress
            setProgress(statusData.progress || 0);
          }
        } catch (pollError) {
          console.error('Polling error:', pollError);
        }
      }, 3000); // Poll every 3 seconds

      // Safety timeout after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (generating) {
          setGenerating(false);
          toast({ 
            variant: 'destructive', 
            title: 'Timeout', 
            description: 'Video generation is taking too long. Please try again.' 
          });
        }
      }, 600000);

    } catch (error) {
      console.error('Video generation error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Generation failed', 
        description: error.message 
      });
      setGenerating(false);
    }
  };

  const handleDownload = (videoB64, filename) => {
    const base64Data = videoB64 || videoData?.video_base64;
    if (!base64Data) return;
    
    const link = document.createElement('a');
    link.href = `data:video/mp4;base64,${base64Data}`;
    link.download = filename || `munal-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: 'Video downloaded!' });
  };

  const handleSaveToHistory = async () => {
    if (!videoData?.video_base64) return;
    
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/video/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_base64: videoData.video_base64,
          prompt: prompt,
          duration: duration,
          size: size,
          title: saveTitle || `Video - ${duration}s`
        })
      });
      
      if (!res.ok) throw new Error('Failed to save video');
      
      toast({ title: 'Video saved to history!' });
      setShowSaveDialog(false);
      setSaveTitle('');
      loadHistory();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to save', description: error.message });
    }
    setSaving(false);
  };

  const handleDeleteFromHistory = async (videoId) => {
    try {
      const res = await fetch(`${API_URL}/api/ai/video/history/${videoId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete');
      
      toast({ title: 'Video deleted' });
      loadHistory();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete', description: error.message });
    }
  };

  const handleLoadFromHistory = async (videoId) => {
    try {
      const res = await fetch(`${API_URL}/api/ai/video/history/${videoId}`);
      if (!res.ok) throw new Error('Failed to load video');
      
      const data = await res.json();
      setVideoData(data);
      setPrompt(data.prompt || '');
      setShowHistory(false);
      toast({ title: 'Video loaded from history' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to load', description: error.message });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getSizeIcon = (sizeValue) => {
    switch (sizeValue) {
      case '1280x720':
      case '1792x1024':
        return RectangleHorizontal;
      case '1024x1792':
        return RectangleVertical;
      case '1024x1024':
        return Square;
      default:
        return RectangleHorizontal;
    }
  };

  const getSizeLabel = (sizeValue) => {
    switch (sizeValue) {
      case '1280x720': return 'HD (16:9)';
      case '1792x1024': return 'Widescreen (16:9)';
      case '1024x1792': return 'Portrait (9:16)';
      case '1024x1024': return 'Square (1:1)';
      default: return sizeValue;
    }
  };

  if (!serviceAvailable) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Service Unavailable</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Video generation service is not configured. Please contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Text to Video | Munal AI</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-fuchsia-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-fuchsia-950/20">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-2xl shadow-lg shadow-fuchsia-500/30">
              <Video className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Text to Video</h1>
              <p className="text-gray-500 dark:text-gray-400">Generate stunning videos from text descriptions using AI</p>
            </div>
            <Badge className="ml-auto bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white border-0">
              <Sparkles className="w-3 h-3 mr-1" />
              Powered by Sora 2
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Settings */}
            <div className="space-y-4">
              <Card className="border-gray-200 dark:border-slate-800">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                  onClick={() => setSettingsOpen(!settingsOpen)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                      General Settings
                    </CardTitle>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", settingsOpen && "rotate-180")} />
                  </div>
                </CardHeader>
                {settingsOpen && (
                  <CardContent className="space-y-6 pt-0">
                      {/* Model */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Model</Label>
                        <Select value={model} onValueChange={setModel} disabled={generating}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sora-2">
                              <div className="flex items-center gap-2">
                                <Film className="w-4 h-4" />
                                <span>Sora 2</span>
                                <Badge variant="secondary" className="text-[10px]">Standard</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="sora-2-pro">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span>Sora 2 Pro</span>
                                <Badge className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">HD</Badge>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Resolution/Size */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Resolution</Label>
                        <Select value={size} onValueChange={setSize} disabled={generating}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              { value: '1280x720', label: 'HD 720p', aspect: '16:9' },
                              { value: '1792x1024', label: 'Widescreen', aspect: '16:9' },
                              { value: '1024x1792', label: 'Portrait', aspect: '9:16' },
                              { value: '1024x1024', label: 'Square', aspect: '1:1' },
                            ].map((option) => {
                              const Icon = getSizeIcon(option.value);
                              return (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4" />
                                    <span>{option.label}</span>
                                    <span className="text-gray-400 text-xs">({option.aspect})</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Duration */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Duration</Label>
                          <span className="text-sm font-semibold text-fuchsia-600">{duration} seconds</span>
                        </div>
                        
                        {/* Base durations */}
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500 font-medium">Quick clips</p>
                          <div className="flex gap-2">
                            {[4, 8, 12].map((d) => (
                              <Button
                                key={d}
                                variant={duration === d ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setDuration(d)}
                                disabled={generating}
                                className={cn(
                                  "flex-1",
                                  duration === d && "bg-gradient-to-r from-fuchsia-500 to-pink-500 border-0"
                                )}
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {d}s
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Extended durations */}
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500 font-medium">Extended (multi-clip)</p>
                          <div className="grid grid-cols-4 gap-2">
                            {[24, 36, 48, 60].map((d) => (
                              <Button
                                key={d}
                                variant={duration === d ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setDuration(d)}
                                disabled={generating}
                                className={cn(
                                  duration === d && "bg-gradient-to-r from-violet-500 to-fuchsia-500 border-0"
                                )}
                              >
                                {d}s
                              </Button>
                            ))}
                          </div>
                          {duration >= 24 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              ⚡ Extended: {Math.ceil(duration / 12)} clips will be generated and stitched together
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

              {/* Info Card */}
              <Card className="bg-gradient-to-br from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/30 dark:to-pink-950/30 border-fuchsia-200 dark:border-fuchsia-800">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-2 text-fuchsia-700 dark:text-fuchsia-300">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    AI Video Tips
                  </h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Be descriptive: Include scene, action, style</li>
                    <li>• Specify camera movement if needed</li>
                    <li>• Mention lighting and mood</li>
                    <li>• Generation takes 2-5 minutes</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Center - Video Preview */}
            <div className="lg:col-span-2 space-y-4">
              {/* Video Display */}
              <Card className="overflow-hidden border-gray-200 dark:border-slate-800">
                <div 
                  className={cn(
                    "relative bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center",
                    size === '1024x1792' ? 'aspect-[9/16] max-h-[600px]' : 
                    size === '1024x1024' ? 'aspect-square max-h-[500px]' : 
                    'aspect-video'
                  )}
                >
                  {videoData?.video_base64 ? (
                    <video
                      src={`data:video/mp4;base64,${videoData.video_base64}`}
                      controls
                      autoPlay
                      loop
                      className="w-full h-full object-contain"
                    />
                  ) : generating ? (
                    <div className="text-center text-white p-8">
                      <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-fuchsia-400" />
                      <h3 className="text-xl font-semibold mb-2">
                        {duration >= 24 
                          ? `Generating ${Math.ceil(duration / 12)} clips...` 
                          : 'Generating your video...'}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">
                        {duration >= 24 
                          ? `Extended video: ${duration}s total. This may take ${Math.ceil(duration / 12) * 3}-${Math.ceil(duration / 12) * 5} minutes`
                          : 'This may take 2-5 minutes'}
                      </p>
                      <div className="w-64 mx-auto bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-fuchsia-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{Math.round(progress)}% complete</p>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 p-8">
                      <Video className="w-20 h-20 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium text-gray-300 mb-2">No video yet</h3>
                      <p className="text-sm">Enter a prompt and click Generate to create a video</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Prompt Input */}
              <Card className="border-gray-200 dark:border-slate-800">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Prompt</Label>
                    <Textarea
                      placeholder="Describe the video you want to create... e.g., 'A serene sunset over ocean waves with golden light reflecting on the water, cinematic slow motion'"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={generating}
                      className="min-h-[100px] resize-none text-base"
                      data-testid="video-prompt-input"
                    />
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs text-gray-500">{prompt.length} / 1000 characters</span>
                      <div className="flex gap-2 flex-wrap">
                        {videoData?.video_base64 && (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => handleDownload()}
                              className="gap-2"
                              data-testid="download-video-btn"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setShowSaveDialog(true)}
                              className="gap-2"
                              data-testid="save-video-btn"
                            >
                              <Save className="w-4 h-4" />
                              Save to History
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => setShowHistory(true)}
                          className="gap-2"
                          data-testid="history-btn"
                        >
                          <History className="w-4 h-4" />
                          History
                        </Button>
                        <Button
                          onClick={handleGenerate}
                          disabled={generating || !prompt.trim()}
                          className="gap-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
                          data-testid="generate-video-btn"
                        >
                          {generating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Generate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TextToVideoPage;
