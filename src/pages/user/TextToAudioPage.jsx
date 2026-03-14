import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Volume2, Play, Pause, Download, Loader2, Mic, RefreshCw, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { getApiUrl, API_URL } from '@/lib/api';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TextToAudioPage = () => {
  const { toast } = useToast();
  const audioRef = useRef(null);
  
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('nova');
  const [model, setModel] = useState('tts-1');
  const [speed, setSpeed] = useState([1.0]);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState([]);

  // Fetch available voices on mount
  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tts/voices`);
      if (response.ok) {
        const data = await response.json();
        setVoices(data.voices || []);
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
      // Fallback voices
      setVoices([
        { id: 'alloy', name: 'Alloy', gender: 'neutral', description: 'Neutral, balanced voice' },
        { id: 'ash', name: 'Ash', gender: 'male', description: 'Clear, articulate male voice' },
        { id: 'coral', name: 'Coral', gender: 'female', description: 'Warm, friendly female voice' },
        { id: 'echo', name: 'Echo', gender: 'male', description: 'Smooth, calm male voice' },
        { id: 'fable', name: 'Fable', gender: 'neutral', description: 'Expressive, storytelling voice' },
        { id: 'nova', name: 'Nova', gender: 'female', description: 'Energetic, upbeat female voice' },
        { id: 'onyx', name: 'Onyx', gender: 'male', description: 'Deep, authoritative male voice' },
        { id: 'sage', name: 'Sage', gender: 'female', description: 'Wise, measured female voice' },
        { id: 'shimmer', name: 'Shimmer', gender: 'female', description: 'Bright, cheerful female voice' }
      ]);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter some text to convert"
      });
      return;
    }

    if (text.length > 4096) {
      toast({
        variant: "destructive",
        title: "Text too long",
        description: "Maximum 4096 characters allowed"
      });
      return;
    }

    setLoading(true);
    setAudioUrl(null);
    setAudioBlob(null);
    setIsPlaying(false);

    const apiUrl = API_URL || window.location.origin;
    console.log('TTS Request to:', `${apiUrl}/api/tts/generate`);

    try {
      const response = await fetch(`${apiUrl}/api/tts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          voice,
          model,
          speed: speed[0]
        })
      });

      console.log('TTS Response status:', response.status);

      if (!response.ok) {
        // Clone response before reading to avoid consuming it
        const errorText = await response.text();
        console.error('TTS Error:', errorText);
        let errorMessage = 'Failed to generate audio';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Get audio blob with correct MIME type
      const rawBlob = await response.blob();
      console.log('TTS Blob received:', rawBlob.size, 'bytes, type:', rawBlob.type);
      
      if (rawBlob.size < 100) {
        throw new Error('Audio generation returned empty or invalid data');
      }
      
      // Create blob with explicit audio/mpeg type and store it
      const typedBlob = new Blob([rawBlob], { type: 'audio/mpeg' });
      setAudioBlob(typedBlob);
      
      const url = URL.createObjectURL(typedBlob);
      setAudioUrl(url);

      toast({
        title: "Audio generated!",
        description: "Click play to listen or download the audio"
      });

    } catch (error) {
      console.error('TTS error:', error);
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message || "Failed to generate audio"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    if (audioBlob) {
      try {
        // Use the stored blob directly
        const downloadUrl = URL.createObjectURL(audioBlob);
        
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `speech_${voice}_${Date.now()}.mp3`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Clean up after a short delay
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);
        }, 100);
        
        toast({
          title: "Download started",
          description: "Your audio file is being downloaded"
        });
      } catch (error) {
        console.error('Download error:', error);
        toast({
          variant: "destructive",
          title: "Download failed",
          description: "Could not download the audio file"
        });
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleClear = () => {
    setText('');
    setAudioUrl(null);
    setAudioBlob(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const selectedVoice = voices.find(v => v.id === voice);
  const charCount = text.length;
  const charLimit = 4096;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto" data-testid="text-to-audio-page">
      <Helmet><title>Text to Audio | Munal</title></Helmet>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Volume2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Text to Audio</h1>
            <p className="text-gray-500 dark:text-gray-400">Convert your text to natural-sounding speech</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Input Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enter Your Text</CardTitle>
              <CardDescription>Type or paste the text you want to convert to speech</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="Enter text here... (e.g., 'Hello! Welcome to Munal, your AI meeting companion.')"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[200px] resize-none text-base"
                  data-testid="text-input"
                />
                <div className={`absolute bottom-2 right-2 text-xs ${charCount > charLimit ? 'text-red-500' : 'text-gray-400'}`}>
                  {charCount.toLocaleString()} / {charLimit.toLocaleString()}
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleGenerate} 
                  disabled={loading || !text.trim() || charCount > charLimit}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  data-testid="generate-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Audio
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleClear} disabled={loading}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Audio Player */}
          {audioUrl && (
            <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      size="lg"
                      className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700"
                      onClick={handlePlayPause}
                      data-testid="play-pause-btn"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6 ml-1" />
                      )}
                    </Button>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Audio Ready</p>
                      <p className="text-sm text-gray-500">Voice: {selectedVoice?.name || voice}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleDownload} className="gap-2" data-testid="download-btn">
                    <Download className="w-4 h-4" />
                    Download MP3
                  </Button>
                </div>
                
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={handleAudioEnded}
                  className="hidden"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          {/* Voice Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Voice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger data-testid="voice-select">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      <div className="flex items-center gap-2">
                        <User className={`w-3 h-3 ${v.gender === 'female' ? 'text-pink-500' : v.gender === 'male' ? 'text-blue-500' : 'text-gray-500'}`} />
                        <span>{v.name}</span>
                        <Badge variant="secondary" className="text-xs ml-1">
                          {v.gender}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedVoice && (
                <p className="text-xs text-gray-500">{selectedVoice.description}</p>
              )}
            </CardContent>
          </Card>

          {/* Model Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger data-testid="model-select">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tts-1">
                    <div className="flex items-center gap-2">
                      <span>Standard</span>
                      <Badge variant="secondary" className="text-xs">Fast</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="tts-1-hd">
                    <div className="flex items-center gap-2">
                      <span>HD Quality</span>
                      <Badge className="text-xs bg-purple-100 text-purple-700">Premium</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Speed Control */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Speed</span>
                <Badge variant="outline">{speed[0]}x</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Slider
                value={speed}
                onValueChange={setSpeed}
                min={0.25}
                max={4}
                step={0.25}
                className="w-full"
                data-testid="speed-slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>0.25x</span>
                <span>1x</span>
                <span>4x</span>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-gray-50 dark:bg-gray-900/50">
            <CardContent className="p-4">
              <h4 className="font-medium text-sm mb-2">Tips</h4>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Use HD quality for professional content</li>
                <li>• Try different voices to find your style</li>
                <li>• Adjust speed for better pacing</li>
                <li>• Max 4,096 characters per generation</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TextToAudioPage;
