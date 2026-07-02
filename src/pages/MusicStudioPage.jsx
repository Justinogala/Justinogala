import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  Music, Sparkles, Download, Play, Pause, Loader2, Clock, Trash2,
  History, Wand2, Volume2, Timer, RefreshCw, Guitar, Disc3,
  CreditCard, Coins, ChevronRight, FileText, ThumbsUp, ThumbsDown, Share2
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

const getToken = () => {
  try {
    const session = JSON.parse(localStorage.getItem('munal_sessions') || '{}');
    if (session.token) return session.token;
  } catch {}
  return localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
};
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

const PRESETS = [
  { label: 'Afrobeat', prompt: 'Afrobeat song with infectious grooves, talking drums, highlife guitar licks, and Afro-pop vocals', icon: '🥁' },
  { label: 'Amapiano', prompt: 'Amapiano track with deep log drums, jazzy piano chords, shakers, and a smooth South African groove', icon: '🇿🇦' },
  { label: 'Reggae', prompt: 'Reggae song with offbeat rhythm guitar, deep bass, one drop drumming, and positive vibes', icon: '🟢' },
  { label: 'Dancehall', prompt: 'Dancehall riddim with heavy bass, fast-paced drums, digital synths, and Caribbean energy', icon: '🔥' },
  { label: 'Lo-Fi', prompt: 'Chill lo-fi hip hop beat with soft piano, vinyl crackle, and a relaxing late-night vibe', icon: '🎧' },
  { label: 'Hip Hop', prompt: 'Hard-hitting hip hop beat with 808 bass, crisp hi-hats, and trap-style production', icon: '🎙️' },
  { label: 'R&B', prompt: 'Smooth R&B track with silky vocals, lush harmonies, slow groove, and romantic mood', icon: '💜' },
  { label: 'Pop', prompt: 'Catchy pop song with upbeat melody, modern production, and feel-good energy', icon: '🎤' },
  { label: 'Gospel', prompt: 'Uplifting gospel song with powerful choir harmonies, organ, and spiritual energy', icon: '🙏' },
  { label: 'Jazz', prompt: 'Smooth jazz with saxophone, upright bass, brushed drums, and a warm evening feel', icon: '🎷' },
  { label: 'Cinematic', prompt: 'An epic cinematic orchestral score with sweeping strings, brass, and thundering drums', icon: '🎬' },
  { label: 'Electronic', prompt: 'Modern electronic dance music with pulsing synths, deep bass, and driving beats', icon: '🎹' },
  { label: 'Rock', prompt: 'Energetic rock instrumental with electric guitar riffs, powerful drums, and driving bass', icon: '🎸' },
  { label: 'Latin', prompt: 'Latin reggaeton track with dembow rhythm, catchy melodic hook, and tropical vibes', icon: '🌴' },
  { label: 'Country', prompt: 'Country song with acoustic guitar, pedal steel, fiddle, and heartfelt storytelling', icon: '🤠' },
  { label: 'Classical', prompt: 'Beautiful classical piano piece with emotional melodies and dynamic expression', icon: '🎼' },
  { label: 'Afro Fusion', prompt: 'Afro fusion blending Afrobeat with electronic elements, deep bass, and world music textures', icon: '🌍' },
  { label: 'Corporate', prompt: 'Upbeat corporate background music with light piano, acoustic guitar, and positive energy', icon: '💼' },
];

const SFX_PRESETS = [
  { label: 'Thunder', prompt: 'Thunder rumbling in the distance with light rain' },
  { label: 'Crowd Cheering', prompt: 'Large stadium crowd cheering and applauding' },
  { label: 'Notification', prompt: 'Pleasant notification chime, modern UI sound' },
  { label: 'Whoosh', prompt: 'Fast cinematic whoosh transition sound effect' },
  { label: 'Ocean Waves', prompt: 'Gentle ocean waves lapping on a sandy beach' },
  { label: 'Fire Crackling', prompt: 'Warm fireplace with wood crackling and popping' },
];

const CREDIT_PACKAGES = [
  { id: 'credits_1000', credits: 1000, price: 10, label: '1,000 Credits', songs: '~20 songs' },
  { id: 'credits_3000', credits: 3000, price: 25, label: '3,000 Credits', songs: '~60 songs', save: '20%' },
  { id: 'credits_7500', credits: 7500, price: 50, label: '7,500 Credits', songs: '~150 songs', save: '25%' },
  { id: 'credits_18000', credits: 18000, price: 100, label: '18,000 Credits', songs: '~360 songs', save: '40%' },
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
  const [audioData, setAudioData] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [credits, setCredits] = useState(0);
  const [isFreeUser, setIsFreeUser] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [purchasing, setPurchasing] = useState(null);
  const audioRef = useRef(null);
  const pollRef = useRef(null);

  const loadCredits = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/music-studio/credits`, { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setCredits(d.credits); setIsFreeUser(d.is_free); }
    } catch {}
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/music-studio/history?limit=20`, { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setHistory(d.items || []); }
    } catch {}
  }, []);

  useEffect(() => {
    loadCredits();
    loadHistory();
    // Check for credit purchase success
    const params = new URLSearchParams(window.location.search);
    if (params.get('credits') === 'success') {
      const sessionId = params.get('session_id');
      if (sessionId) {
        fetch(`${API_URL}/api/music-studio/verify-purchase?session_id=${sessionId}`, { headers: authHeaders() })
          .then(r => r.json()).then(d => {
            if (d.success) {
              toast({ title: `${d.credits_added?.toLocaleString() || ''} Munal Credits added!` });
              setCredits(d.credits);
            }
          });
        window.history.replaceState({}, '', '/music-studio');
      }
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handlePurchase = async (packageId) => {
    setPurchasing(packageId);
    try {
      const res = await fetch(`${API_URL}/api/music-studio/purchase-credits`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ package_id: packageId })
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      const d = await res.json();
      if (d.checkout_url) window.location.href = d.checkout_url;
    } catch (e) {
      toast({ variant: 'destructive', title: 'Purchase failed', description: e.message });
    } finally { setPurchasing(null); }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!isFreeUser && credits < 50 && type === 'music') {
      setShowBuyCredits(true);
      toast({ variant: 'destructive', title: 'Insufficient credits', description: 'Purchase Munal Credits to generate music' });
      return;
    }
    setGenerating(true);
    setAudioData(null);
    setProgressMsg('Submitting to Suno AI...');

    try {
      const body = { prompt, instrumental, custom_mode: customMode, title, style, type };
      const res = await fetch(`${API_URL}/api/music-studio/generate`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body)
      });
      if (!res.ok) {
        const e = await res.json();
        if (res.status === 402) { setShowBuyCredits(true); }
        throw new Error(e.detail || 'Failed');
      }
      const d = await res.json();
      if (d.credits_remaining !== undefined) setCredits(d.credits_remaining);

      if (d.status === 'completed') {
        setAudioData(d); setGenerating(false);
        loadCredits(); loadHistory();
        return;
      }

      setProgressMsg('Suno AI is composing your music...');
      pollRef.current = setInterval(async () => {
        try {
          const sr = await fetch(`${API_URL}/api/music-studio/job/${d.job_id}`, { headers: authHeaders() });
          const sd = await sr.json();
          if (sd.status === 'completed') {
            clearInterval(pollRef.current);
            setAudioData(sd); setGenerating(false); setProgressMsg('');
            loadCredits(); loadHistory();
          } else if (sd.status === 'failed') {
            clearInterval(pollRef.current);
            setGenerating(false); setProgressMsg('');
            toast({ variant: 'destructive', title: 'Generation failed', description: sd.error });
          } else {
            setProgressMsg(sd.message || 'Composing...');
          }
        } catch {}
      }, 4000);
      setTimeout(() => { if (pollRef.current) { clearInterval(pollRef.current); setGenerating(false); setProgressMsg(''); } }, 300000);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Generation failed', description: e.message });
      setGenerating(false); setProgressMsg('');
    }
  };

  const handlePlay = (b64, url) => {
    const src = b64 ? `data:audio/mpeg;base64,${b64}` : url;
    if (!src) return;
    if (playing && audioRef.current) { audioRef.current.pause(); setPlaying(false); return; }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.onended = () => setPlaying(false);
    audio.play(); setPlaying(true);
  };

  const handleDownload = (b64, name, url) => {
    if (b64) {
      const link = document.createElement('a');
      link.href = `data:audio/mpeg;base64,${b64}`;
      link.download = name || `munal-music-${Date.now()}.mp3`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } else if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = name || `munal-music-${Date.now()}.mp3`;
      link.target = '_blank';
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }
  };

  const playHistoryItem = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/music-studio/history/${id}`, { headers: authHeaders() });
      if (res.ok) {
        const d = await res.json();
        handlePlay(d.audio_base64, d.audio_url);
      }
    } catch {}
  };

  return (
    <PageTransition>
      <Helmet><title>Munal Music Studio | Munal AI</title></Helmet>
      <div className="max-w-6xl mx-auto space-y-6" data-testid="music-studio-page">

        {/* Header */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Munal Music Studio</h1>
            <p className="text-sm text-gray-500">AI-powered music generation — describe it, we create it</p>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {/* Credits badge */}
            {isFreeUser ? (
              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 px-3 py-1">
                <Sparkles className="w-3 h-3 mr-1" /> Unlimited Access
              </Badge>
            ) : (
              <button onClick={() => setShowBuyCredits(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-200 dark:border-amber-800 hover:shadow-md transition-all"
                data-testid="credits-badge">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-amber-700 dark:text-amber-400">{credits.toLocaleString()}</span>
                <span className="text-xs text-amber-600 dark:text-amber-500">Credits</span>
                <ChevronRight className="w-3 h-3 text-amber-400" />
              </button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)} className="gap-1.5" data-testid="music-history-btn">
              <History className="w-4 h-4" /> History
            </Button>
          </div>
        </div>

        {/* Type Tabs */}
        <div className="flex gap-2">
          <Button variant={type === 'music' ? 'default' : 'outline'} onClick={() => setType('music')}
            className={cn("gap-2", type === 'music' && "bg-gradient-to-r from-fuchsia-600 to-purple-600")} data-testid="tab-music">
            <Music className="w-4 h-4" /> Music <Badge variant="secondary" className="text-[10px] ml-1">50 credits</Badge>
          </Button>
          <Button variant={type === 'sfx' ? 'default' : 'outline'} onClick={() => setType('sfx')}
            className={cn("gap-2", type === 'sfx' && "bg-gradient-to-r from-amber-500 to-orange-500")} data-testid="tab-sfx">
            <Volume2 className="w-4 h-4" /> Sound Effects <Badge variant="secondary" className="text-[10px] ml-1">10 credits</Badge>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
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
                      <div><Label className="text-xs">Song Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="My Song" disabled={generating} className="mt-1" /></div>
                      <div><Label className="text-xs">Style / Genre</Label><Input value={style} onChange={e => setStyle(e.target.value)} placeholder="Pop, Upbeat, 120 BPM" disabled={generating} className="mt-1" /></div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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

          {/* Right */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-5 space-y-4">
                <Label className="text-base font-semibold">{type === 'music' ? 'Describe your music' : 'Describe the sound effect'}</Label>
                <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4}
                  placeholder={type === 'music' ? "e.g. A chill lo-fi beat with soft piano and vinyl crackle..." : "e.g. Thunder rumbling with light rain..."}
                  disabled={generating} className="text-sm resize-none" data-testid="music-prompt" />
                <Button onClick={handleGenerate} disabled={generating || !prompt.trim()}
                  className="w-full gap-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 h-11"
                  data-testid="generate-music-btn">
                  {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> {progressMsg || 'Generating...'}</> :
                    <><Sparkles className="w-4 h-4" /> Generate {type === 'music' ? 'Music' : 'Sound Effect'}</>}
                </Button>
              </CardContent>
            </Card>

            {generating && (
              <Card className="border-fuchsia-200 dark:border-fuchsia-800">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg shadow-fuchsia-500/30">
                    <Music className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Composing your music...</h3>
                  <p className="text-sm text-gray-500">{progressMsg || 'This usually takes 30-60 seconds'}</p>
                  <div className="flex items-end justify-center gap-1 mt-6 h-12">
                    {Array.from({ length: 20 }, (_, i) => (
                      <div key={i} className="w-1.5 bg-gradient-to-t from-fuchsia-400 to-purple-400 rounded-t-sm animate-pulse"
                        style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Result with Lyrics */}
            {audioData && !generating && (
              <Card className="overflow-hidden border-fuchsia-200 dark:border-fuchsia-800" data-testid="music-result">
                <div className="bg-gradient-to-br from-fuchsia-50 to-purple-50 dark:from-fuchsia-950/30 dark:to-purple-950/30 p-6">
                  <div className="flex items-start gap-4 mb-4">
                    {audioData.image_url && (
                      <img src={audioData.image_url} alt={audioData.title} className="w-20 h-20 rounded-xl object-cover shadow-md" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <button onClick={() => handlePlay(audioData.audio_base64, audioData.audio_url)}
                          className="w-12 h-12 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/30 hover:scale-105 transition-transform shrink-0"
                          data-testid="play-music-btn">
                          {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                        </button>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{audioData.title || prompt.slice(0, 50)}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                            {audioData.duration > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.floor(audioData.duration / 60)}:{String(Math.round(audioData.duration % 60)).padStart(2, '0')}</span>}
                            {audioData.file_size > 0 && <span>{(audioData.file_size / 1024 / 1024).toFixed(1)} MB</span>}
                            {audioData.tags && <Badge variant="secondary" className="text-[10px]">{audioData.tags.slice(0, 40)}</Badge>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => handleDownload(audioData.audio_base64, null, audioData.audio_url)} className="gap-1.5" data-testid="download-music-btn">
                        <Download className="w-3.5 h-3.5" /> Download
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setAudioData(null); setPrompt(''); }}><RefreshCw className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                  {/* Waveform */}
                  <div className="h-14 flex items-end gap-[2px] opacity-60 mb-2">
                    {Array.from({ length: 80 }, (_, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-fuchsia-400 to-purple-400 rounded-t-sm transition-all"
                        style={{ height: `${20 + Math.sin(i * 0.3) * 30 + Math.random() * 20}%`, opacity: playing ? 1 : 0.5 }} />
                    ))}
                  </div>
                </div>

                {/* Lyrics Section */}
                {audioData.lyrics && audioData.lyrics.trim() && (
                  <div className="p-5 border-t border-fuchsia-100 dark:border-fuchsia-900/30" data-testid="lyrics-section">
                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-fuchsia-500" /> Lyrics
                    </h4>
                    <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                      {audioData.lyrics}
                    </pre>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* My Library — Suno-style track list */}
        {history.length > 0 && (
          <div className="mt-8" data-testid="music-library">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Music className="w-5 h-5 text-fuchsia-500" /> My Library
              <Badge variant="secondary" className="text-xs">{history.length} tracks</Badge>
            </h2>
            <div className="space-y-3">
              {history.map((item, idx) => {
                const colors = ['from-orange-400 to-amber-500', 'from-emerald-400 to-green-500', 'from-fuchsia-400 to-purple-500', 'from-cyan-400 to-blue-500', 'from-rose-400 to-pink-500', 'from-violet-400 to-indigo-500'];
                const color = colors[idx % colors.length];
                const sections = ['INTRO', 'VERSE 1', 'PRE...', 'CHORUS', 'VERSE 2', 'PRE...', 'CHO...', 'BRIDGE', 'FINAL...'];
                const dur = item.duration || 120;

                return (
                  <div key={item.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-shadow group">
                    {/* Track header */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button onClick={() => playHistoryItem(item.id)}
                        className="w-10 h-10 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center text-white shadow-md hover:scale-110 transition-transform shrink-0">
                        <Play className="w-4 h-4 ml-0.5" />
                      </button>
                      {item.image_url && (
                        <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{item.title || item.prompt?.slice(0, 40)}</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                          {item.tags && <span className="truncate max-w-[200px]">{item.tags.slice(0, 50)}</span>}
                          <span>{Math.floor(dur / 60)}:{String(Math.round(dur % 60)).padStart(2, '0')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-green-500 transition-colors"><ThumbsUp className="w-3.5 h-3.5" /></button>
                        <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-red-400 transition-colors"><ThumbsDown className="w-3.5 h-3.5" /></button>
                        <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-fuchsia-500 transition-colors"><Share2 className="w-3.5 h-3.5" /></button>
                        <button onClick={async () => {
                          const res = await fetch(`${API_URL}/api/music-studio/history/${item.id}`, { headers: authHeaders() });
                          if (res.ok) { const d = await res.json(); if (d.audio_base64) handleDownload(d.audio_base64, `${item.title || 'track'}.mp3`); }
                        }} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-fuchsia-500 transition-colors"><Download className="w-3.5 h-3.5" /></button>
                        <button onClick={async () => {
                          await fetch(`${API_URL}/api/music-studio/history/${item.id}`, { method: 'DELETE', headers: authHeaders() });
                          loadHistory();
                        }} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    {/* Waveform visualization — Suno style */}
                    <div className={cn("mx-4 mb-3 rounded-lg overflow-hidden bg-gradient-to-r", color, "p-0.5")}>
                      <div className="flex h-16 gap-[1px]">
                        {sections.slice(0, Math.max(4, Math.min(9, Math.round(dur / 15)))).map((section, si) => (
                          <div key={si} className="flex-1 relative bg-black/20 rounded-sm overflow-hidden">
                            <span className="absolute top-1 left-1 text-[8px] font-bold text-white/90 z-10 uppercase tracking-wider">{section}</span>
                            <div className="absolute inset-0 flex items-end gap-[0.5px] px-0.5 pt-4 pb-0.5">
                              {Array.from({ length: 20 }, (_, bi) => {
                                const seed = (item.id?.charCodeAt(si * 3 + bi) || bi * 7) + si * 13 + bi;
                                const h = 25 + (Math.sin(seed * 0.7) * 30) + ((seed * 17) % 40);
                                return <div key={bi} className="flex-1 rounded-t-sm bg-white/50" style={{ height: `${h}%` }} />;
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Buy Credits Dialog */}
      <Dialog open={showBuyCredits} onOpenChange={setShowBuyCredits}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Coins className="w-5 h-5 text-amber-500" /> Buy Munal Credits</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 -mt-2">Credits are used to generate music and sound effects. They never expire.</p>
          <div className="space-y-3 mt-2">
            {CREDIT_PACKAGES.map(pkg => (
              <button key={pkg.id} onClick={() => handlePurchase(pkg.id)} disabled={!!purchasing}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-md text-left",
                  purchasing === pkg.id ? "border-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-950/20" : "border-gray-200 dark:border-gray-700 hover:border-fuchsia-300"
                )} data-testid={`buy-${pkg.id}`}>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                  ${pkg.price}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-white">{pkg.label}</span>
                    {pkg.save && <Badge className="bg-emerald-100 text-emerald-700 text-[10px] border-0">Save {pkg.save}</Badge>}
                  </div>
                  <span className="text-xs text-gray-500">{pkg.songs}</span>
                </div>
                {purchasing === pkg.id ? <Loader2 className="w-5 h-5 animate-spin text-fuchsia-500" /> :
                  <CreditCard className="w-5 h-5 text-gray-400" />}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">Secure payment via Stripe. Credits are non-refundable.</p>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Generation History</DialogTitle></DialogHeader>
          {history.length === 0 ? (
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
                      {item.duration > 0 && <span>{Math.floor(item.duration / 60)}:{String(Math.round(item.duration % 60)).padStart(2, '0')}</span>}
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400"
                    onClick={async () => { await fetch(`${API_URL}/api/music-studio/history/${item.id}`, { method: 'DELETE', headers: authHeaders() }); loadHistory(); }}>
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
