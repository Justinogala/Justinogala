import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import {
  Music, Sparkles, Download, Play, Pause, Loader2, Clock, Trash2,
  History, Wand2, Volume2, Square, Timer, RefreshCw, Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import PageTransition from '@/components/PageTransition';

const PRESETS = [
  { label: 'Cinematic', prompt: 'A cinematic orchestral score with sweeping strings and epic drums', icon: '🎬' },
  { label: 'Lo-Fi', prompt: 'Chill lo-fi hip hop beat with soft piano and vinyl crackle', icon: '🎧' },
  { label: 'Corporate', prompt: 'Upbeat corporate background music with light piano and acoustic guitar', icon: '💼' },
  { label: 'Electronic', prompt: 'Modern electronic dance music with pulsing synths and driving beats', icon: '🎹' },
  { label: 'Ambient', prompt: 'Peaceful ambient soundscape with soft pads and nature textures', icon: '🌊' },
  { label: 'Jazz', prompt: 'Smooth jazz with saxophone, upright bass and brushed drums', icon: '🎷' },
  { label: 'Rock', prompt: 'Energetic rock instrumental with electric guitar riffs and powerful drums', icon: '🎸' },
  { label: 'Podcast Intro', prompt: 'Short upbeat podcast intro jingle with modern feel, 5 seconds', icon: '🎙️' },
];

const SFX_PRESETS = [
  { label: 'Thunder', prompt: 'Thunder rumbling in the distance with light rain' },
  { label: 'Crowd Cheering', prompt: 'Large stadium crowd cheering and applauding' },
  { label: 'Notification', prompt: 'Pleasant notification chime, modern UI sound' },
  { label: 'Whoosh', prompt: 'Fast cinematic whoosh transition sound effect' },
  { label: 'Typing', prompt: 'Fast keyboard typing in a quiet office' },
  { label: 'Ocean Waves', prompt: 'Gentle ocean waves lapping on a beach' },
];

const MusicStudioPage = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState('music');
  const [durationMs, setDurationMs] = useState(30000);
  const [instrumental, setInstrumental] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [audioData, setAudioData] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(true);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/api/music-studio/status`).then(r => r.json()).then(d => setAvailable(d.available)).catch(() => setAvailable(false));
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/music-studio/history?limit=20`);
      if (res.ok) { const d = await res.json(); setHistory(d.items || []); }
    } catch {}
    setHistoryLoading(false);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast({ variant: 'destructive', title: 'Enter a description first' }); return; }
    setGenerating(true);
    setAudioData(null);
    try {
      const res = await fetch(`${API_URL}/api/music-studio/generate-music`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, duration_ms: durationMs, instrumental, type })
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed'); }
      const d = await res.json();
      setAudioData(d);
      toast({ title: `${type === 'music' ? 'Music' : 'Sound effect'} generated!` });
      loadHistory();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Generation failed', description: e.message });
    } finally {
      setGenerating(false);
    }
  };

  const handlePlay = () => {
    if (!audioData?.audio_base64) return;
    if (playing && audioRef.current) { audioRef.current.pause(); setPlaying(false); return; }
    const audio = new Audio(`data:audio/mpeg;base64,${audioData.audio_base64}`);
    audioRef.current = audio;
    audio.onended = () => setPlaying(false);
    audio.play();
    setPlaying(true);
  };

  const handleDownload = (b64, name) => {
    const data = b64 || audioData?.audio_base64;
    if (!data) return;
    const link = document.createElement('a');
    link.href = `data:audio/mpeg;base64,${data}`;
    link.download = name || `munal-${type}-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const playHistoryItem = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/music-studio/history/${id}`);
      if (res.ok) {
        const d = await res.json();
        if (d.audio_base64) {
          if (audioRef.current) audioRef.current.pause();
          const audio = new Audio(`data:audio/mpeg;base64,${d.audio_base64}`);
          audioRef.current = audio;
          audio.onended = () => setPlaying(false);
          audio.play();
          setPlaying(true);
        }
      }
    } catch {}
  };

  const deleteHistoryItem = async (id) => {
    try {
      await fetch(`${API_URL}/api/music-studio/history/${id}`, { method: 'DELETE' });
      loadHistory();
    } catch {}
  };

  const durationLabel = type === 'music'
    ? `${Math.round(durationMs / 1000)}s (${Math.floor(durationMs / 60000)}m ${Math.round((durationMs % 60000) / 1000)}s)`
    : `${Math.round(durationMs / 1000)}s`;

  return (
    <PageTransition>
      <Helmet><title>Munal Music Studio | Munal AI</title></Helmet>
      <div className="max-w-6xl mx-auto space-y-6" data-testid="music-studio-page">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Munal Music Studio</h1>
            <p className="text-sm text-gray-500">AI-powered music & sound effects — describe it, generate it</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white border-0">
              <Sparkles className="w-3 h-3 mr-1" />ElevenLabs
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)} className="gap-1.5" data-testid="music-history-btn">
              <History className="w-4 h-4" /> History
            </Button>
          </div>
        </div>

        {/* Type Tabs */}
        <div className="flex gap-2">
          <Button variant={type === 'music' ? 'default' : 'outline'} onClick={() => { setType('music'); setDurationMs(30000); }}
            className={cn("gap-2", type === 'music' && "bg-gradient-to-r from-fuchsia-600 to-purple-600")} data-testid="tab-music">
            <Music className="w-4 h-4" /> Music
          </Button>
          <Button variant={type === 'sfx' ? 'default' : 'outline'} onClick={() => { setType('sfx'); setDurationMs(10000); }}
            className={cn("gap-2", type === 'sfx' && "bg-gradient-to-r from-amber-500 to-orange-500")} data-testid="tab-sfx">
            <Volume2 className="w-4 h-4" /> Sound Effects
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Settings */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Timer className="w-4 h-4" /> Settings</CardTitle></CardHeader>
              <CardContent className="space-y-5 pt-0">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Duration</Label>
                    <span className="text-xs font-semibold text-fuchsia-600">{durationLabel}</span>
                  </div>
                  <Slider
                    value={[durationMs]}
                    onValueChange={v => setDurationMs(v[0])}
                    min={type === 'music' ? 3000 : 500}
                    max={type === 'music' ? 120000 : 30000}
                    step={type === 'music' ? 1000 : 500}
                    disabled={generating}
                    className="[&_[role=slider]]:bg-fuchsia-500"
                  />
                  {type === 'music' && (
                    <div className="flex gap-1.5 flex-wrap">
                      {[10000, 30000, 60000, 120000].map(ms => (
                        <Button key={ms} variant={durationMs === ms ? 'default' : 'outline'} size="sm"
                          onClick={() => setDurationMs(ms)} disabled={generating}
                          className={cn("text-xs", durationMs === ms && "bg-fuchsia-600")}>
                          {ms / 1000}s
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {type === 'music' && (
                  <div className="flex items-center justify-between">
                    <Label>Instrumental only</Label>
                    <Switch checked={instrumental} onCheckedChange={setInstrumental} disabled={generating} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Presets */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wand2 className="w-4 h-4" /> Quick Presets</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2">
                  {(type === 'music' ? PRESETS : SFX_PRESETS).map(p => (
                    <button key={p.label} onClick={() => setPrompt(p.prompt)} disabled={generating}
                      className="text-left p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-fuchsia-300 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/20 transition-all text-xs group">
                      <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-fuchsia-600">
                        {'icon' in p ? `${p.icon} ` : ''}{p.label}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Prompt + Result */}
          <div className="lg:col-span-2 space-y-4">
            {/* Prompt */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <Label className="text-base font-semibold">
                  {type === 'music' ? 'Describe your music' : 'Describe the sound effect'}
                </Label>
                <Textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  rows={4}
                  placeholder={type === 'music'
                    ? "e.g. A chill lo-fi beat with soft piano, vinyl crackle, and a relaxing vibe..."
                    : "e.g. Thunder rumbling in the distance with light rain on a tin roof..."}
                  disabled={generating}
                  className="text-sm resize-none"
                  data-testid="music-prompt"
                />
                <Button onClick={handleGenerate} disabled={generating || !prompt.trim() || !available}
                  className="w-full gap-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 h-11"
                  data-testid="generate-music-btn">
                  {generating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate {type === 'music' ? 'Music' : 'Sound Effect'}</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Result */}
            {audioData && (
              <Card className="overflow-hidden border-fuchsia-200 dark:border-fuchsia-800" data-testid="music-result">
                <div className="bg-gradient-to-br from-fuchsia-50 to-purple-50 dark:from-fuchsia-950/30 dark:to-purple-950/30 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <button onClick={handlePlay}
                      className="w-14 h-14 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/30 hover:scale-105 transition-transform"
                      data-testid="play-music-btn">
                      {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                    </button>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{prompt.slice(0, 60)}...</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.round(audioData.duration_ms / 1000)}s</span>
                        <span>{(audioData.file_size / 1024).toFixed(0)} KB</span>
                        <Badge variant="secondary" className="text-[10px]">{type === 'music' ? 'Music' : 'SFX'}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleDownload()} className="gap-1.5" data-testid="download-music-btn">
                        <Download className="w-3.5 h-3.5" /> Download
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setAudioData(null); setPrompt(''); }} className="gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" /> New
                      </Button>
                    </div>
                  </div>
                  {/* Waveform visual */}
                  <div className="h-16 flex items-end gap-[2px] opacity-70">
                    {Array.from({ length: 80 }, (_, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-fuchsia-400 to-purple-400 rounded-t-sm"
                        style={{ height: `${20 + Math.sin(i * 0.3) * 30 + Math.random() * 20}%`, opacity: playing ? 1 : 0.5 }} />
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Generating state */}
            {generating && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-fuchsia-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Creating your {type === 'music' ? 'music' : 'sound effect'}...</h3>
                  <p className="text-sm text-gray-500">This usually takes 10-30 seconds</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Generation History</DialogTitle></DialogHeader>
          {historyLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-fuchsia-500" /></div>
          ) : history.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No generations yet</p>
          ) : (
            <div className="space-y-2">
              {history.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <button onClick={() => playHistoryItem(item.id)}
                    className="w-9 h-9 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center shrink-0">
                    <Play className="w-4 h-4 text-fuchsia-600" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.prompt}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                      <Badge variant="secondary" className="text-[9px]">{item.type}</Badge>
                      <span>{Math.round(item.duration_ms / 1000)}s</span>
                      <span>{(item.file_size / 1024).toFixed(0)} KB</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => deleteHistoryItem(item.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
};

export default MusicStudioPage;
