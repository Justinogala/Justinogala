import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import {
  Music, Sparkles, Download, Play, Pause, Loader2, Clock, Trash2,
  History, Wand2, Volume2, Timer, RefreshCw, Mic2, Guitar, Disc3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import PageTransition from '@/components/PageTransition';

const PRESETS = [
  { label: 'Cinematic', prompt: 'An epic cinematic orchestral score with sweeping strings, brass, and thundering drums', icon: '🎬' },
  { label: 'Lo-Fi', prompt: 'Chill lo-fi hip hop beat with soft piano, vinyl crackle, and a relaxing late-night vibe', icon: '🎧' },
  { label: 'Corporate', prompt: 'Upbeat corporate background music with light piano, acoustic guitar, and positive energy', icon: '💼' },
  { label: 'Electronic', prompt: 'Modern electronic dance music with pulsing synths, deep bass, and driving beats', icon: '🎹' },
  { label: 'Ambient', prompt: 'Peaceful ambient soundscape with soft pads, gentle piano, and nature-inspired textures', icon: '🌊' },
  { label: 'Jazz', prompt: 'Smooth jazz with saxophone, upright bass, brushed drums, and a warm evening feel', icon: '🎷' },
  { label: 'Rock', prompt: 'Energetic rock instrumental with electric guitar riffs, powerful drums, and driving bass', icon: '🎸' },
  { label: 'Pop', prompt: 'Catchy pop song with upbeat melody, modern production, and feel-good energy', icon: '🎤' },
  { label: 'Hip Hop', prompt: 'Hard-hitting hip hop beat with 808 bass, crisp hi-hats, and trap-style production', icon: '🎙️' },
  { label: 'Classical', prompt: 'Beautiful classical piano piece with emotional melodies and dynamic expression', icon: '🎼' },
];

const SFX_PRESETS = [
  { label: 'Thunder', prompt: 'Thunder rumbling in the distance with light rain' },
  { label: 'Crowd Cheering', prompt: 'Large stadium crowd cheering and applauding' },
  { label: 'Notification', prompt: 'Pleasant notification chime, modern UI sound' },
  { label: 'Whoosh', prompt: 'Fast cinematic whoosh transition sound effect' },
  { label: 'Ocean Waves', prompt: 'Gentle ocean waves lapping on a sandy beach' },
  { label: 'Fire Crackling', prompt: 'Warm fireplace with wood crackling and popping' },
];

const MusicStudioPage = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState('music');
  const [instrumental, setInstrumental] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [audioData, setAudioData] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(true);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const audioRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/api/music-studio/status`).then(r => r.json()).then(d => setAvailable(d.available)).catch(() => setAvailable(false));
    loadHistory();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
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
    setProgressMsg('Submitting to Suno AI...');

    try {
      const body = { prompt, instrumental, custom_mode: customMode, title, style, type };
      const res = await fetch(`${API_URL}/api/music-studio/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed'); }
      const d = await res.json();

      if (d.status === 'completed') {
        // SFX returns immediately
        setAudioData(d);
        setGenerating(false);
        toast({ title: 'Sound effect generated!' });
        loadHistory();
        return;
      }

      // Music: start polling
      setJobId(d.job_id);
      setProgressMsg('Suno AI is composing your music...');
      toast({ title: 'Music generation started!' });

      pollRef.current = setInterval(async () => {
        try {
          const sr = await fetch(`${API_URL}/api/music-studio/job/${d.job_id}`);
          const sd = await sr.json();

          if (sd.status === 'completed') {
            clearInterval(pollRef.current);
            setAudioData(sd);
            setGenerating(false);
            setProgressMsg('');
            toast({ title: 'Music generated!' });
            loadHistory();
          } else if (sd.status === 'failed') {
            clearInterval(pollRef.current);
            setGenerating(false);
            setProgressMsg('');
            toast({ variant: 'destructive', title: 'Generation failed', description: sd.error });
          } else {
            setProgressMsg(sd.message || 'Composing your music...');
          }
        } catch {}
      }, 4000);

      // Timeout after 5 minutes
      setTimeout(() => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          setGenerating(false);
          setProgressMsg('');
          toast({ variant: 'destructive', title: 'Generation timed out' });
        }
      }, 300000);

    } catch (e) {
      toast({ variant: 'destructive', title: 'Generation failed', description: e.message });
      setGenerating(false);
      setProgressMsg('');
    }
  };

  const handlePlay = (b64) => {
    const data = b64 || audioData?.audio_base64;
    if (!data) return;
    if (playing && audioRef.current) { audioRef.current.pause(); setPlaying(false); return; }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(`data:audio/mpeg;base64,${data}`);
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
    link.download = name || `munal-music-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const playHistoryItem = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/music-studio/history/${id}`);
      if (res.ok) {
        const d = await res.json();
        if (d.audio_base64) handlePlay(d.audio_base64);
        else if (d.audio_url) { window.open(d.audio_url, '_blank'); }
      }
    } catch {}
  };

  const deleteHistoryItem = async (id) => {
    await fetch(`${API_URL}/api/music-studio/history/${id}`, { method: 'DELETE' });
    loadHistory();
  };

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
            <p className="text-sm text-gray-500">AI-powered music & sound effects — describe it, Suno creates it</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white border-0">
              <Sparkles className="w-3 h-3 mr-1" />Suno AI
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)} className="gap-1.5" data-testid="music-history-btn">
              <History className="w-4 h-4" /> History
            </Button>
          </div>
        </div>

        {/* Type Tabs */}
        <div className="flex gap-2">
          <Button variant={type === 'music' ? 'default' : 'outline'} onClick={() => setType('music')}
            className={cn("gap-2", type === 'music' && "bg-gradient-to-r from-fuchsia-600 to-purple-600")} data-testid="tab-music">
            <Music className="w-4 h-4" /> Music
          </Button>
          <Button variant={type === 'sfx' ? 'default' : 'outline'} onClick={() => setType('sfx')}
            className={cn("gap-2", type === 'sfx' && "bg-gradient-to-r from-amber-500 to-orange-500")} data-testid="tab-sfx">
            <Volume2 className="w-4 h-4" /> Sound Effects
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Settings + Presets */}
          <div className="space-y-4">
            {type === 'music' && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Timer className="w-4 h-4" /> Options</CardTitle></CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2"><Guitar className="w-4 h-4 text-fuchsia-500" /> Instrumental only</Label>
                    <Switch checked={instrumental} onCheckedChange={setInstrumental} disabled={generating} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2"><Disc3 className="w-4 h-4 text-fuchsia-500" /> Custom mode</Label>
                    <Switch checked={customMode} onCheckedChange={setCustomMode} disabled={generating} />
                  </div>
                  {customMode && (
                    <div className="space-y-3 pt-1">
                      <div>
                        <Label className="text-xs">Song Title</Label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="My Song" disabled={generating} className="mt-1" data-testid="song-title" />
                      </div>
                      <div>
                        <Label className="text-xs">Style / Genre</Label>
                        <Input value={style} onChange={e => setStyle(e.target.value)} placeholder="Pop, Upbeat, 120 BPM" disabled={generating} className="mt-1" data-testid="song-style" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
            <Card>
              <CardContent className="p-5 space-y-4">
                <Label className="text-base font-semibold">
                  {type === 'music' ? 'Describe your music' : 'Describe the sound effect'}
                </Label>
                <Textarea
                  value={prompt} onChange={e => setPrompt(e.target.value)} rows={4}
                  placeholder={type === 'music'
                    ? "e.g. A chill lo-fi beat with soft piano, vinyl crackle, and a warm late-night atmosphere..."
                    : "e.g. Thunder rumbling with light rain on a tin roof..."}
                  disabled={generating} className="text-sm resize-none" data-testid="music-prompt"
                />
                <Button onClick={handleGenerate} disabled={generating || !prompt.trim() || !available}
                  className="w-full gap-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 h-11"
                  data-testid="generate-music-btn">
                  {generating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {progressMsg || 'Generating...'}</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate {type === 'music' ? 'Music' : 'Sound Effect'}</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generating state */}
            {generating && (
              <Card className="border-fuchsia-200 dark:border-fuchsia-800">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg shadow-fuchsia-500/30">
                    <Music className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Suno AI is composing...</h3>
                  <p className="text-sm text-gray-500">{progressMsg || 'This usually takes 30-60 seconds'}</p>
                  {/* Animated bars */}
                  <div className="flex items-end justify-center gap-1 mt-6 h-12">
                    {Array.from({ length: 20 }, (_, i) => (
                      <div key={i} className="w-1.5 bg-gradient-to-t from-fuchsia-400 to-purple-400 rounded-t-sm animate-pulse"
                        style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Result */}
            {audioData && !generating && (
              <Card className="overflow-hidden border-fuchsia-200 dark:border-fuchsia-800" data-testid="music-result">
                <div className="bg-gradient-to-br from-fuchsia-50 to-purple-50 dark:from-fuchsia-950/30 dark:to-purple-950/30 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => handlePlay()}
                      className="w-14 h-14 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/30 hover:scale-105 transition-transform"
                      data-testid="play-music-btn">
                      {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                    </button>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{audioData.title || prompt.slice(0, 60)}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        {audioData.duration > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.round(audioData.duration)}s</span>}
                        {audioData.file_size > 0 && <span>{(audioData.file_size / 1024).toFixed(0)} KB</span>}
                        <Badge variant="secondary" className="text-[10px]">{audioData.type === 'sfx' ? 'SFX' : 'Music'}</Badge>
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
                      <div key={i} className="flex-1 bg-gradient-to-t from-fuchsia-400 to-purple-400 rounded-t-sm transition-all"
                        style={{ height: `${20 + Math.sin(i * 0.3) * 30 + Math.random() * 20}%`, opacity: playing ? 1 : 0.5 }} />
                    ))}
                  </div>
                </div>
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
                    <p className="text-sm font-medium truncate">{item.title || item.prompt}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                      <Badge variant="secondary" className="text-[9px]">{item.type}</Badge>
                      {item.duration > 0 && <span>{Math.round(item.duration)}s</span>}
                      {item.file_size > 0 && <span>{(item.file_size / 1024).toFixed(0)} KB</span>}
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
