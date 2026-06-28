import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import {
  Video, Sparkles, Download, Play, Pause, Loader2, AlertCircle, Settings2, Clock,
  Square, RectangleHorizontal, RectangleVertical, Film, ChevronDown, Save, History,
  Trash2, Eye, Mic, Volume2, StopCircle, Plus, GripVertical, X, ArrowRight, Wand2,
  Layers, Timer, CheckCircle, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api';

const VOICES = [
  { value: 'alloy', name: 'Alloy', desc: 'Neutral, balanced' },
  { value: 'echo', name: 'Echo', desc: 'Male, warm' },
  { value: 'fable', name: 'Fable', desc: 'British accent' },
  { value: 'onyx', name: 'Onyx', desc: 'Male, deep' },
  { value: 'nova', name: 'Nova', desc: 'Female, friendly' },
  { value: 'shimmer', name: 'Shimmer', desc: 'Female, soft' },
];

const DURATION_OPTIONS = [
  { label: '1 min', value: 60, scenes: 2 },
  { label: '2 min', value: 120, scenes: 4 },
  { label: '3 min', value: 180, scenes: 6 },
  { label: '4 min', value: 240, scenes: 8 },
  { label: '5 min', value: 300, scenes: 10 },
];

const TextToVideoPage = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [scenes, setScenes] = useState([]);
  const [step, setStep] = useState('prompt'); // prompt, scenes, generating, done
  const [splitting, setSplitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [scenesTotal, setScenesTotal] = useState(0);
  const [scenesDone, setScenesDone] = useState(0);
  const [videoData, setVideoData] = useState(null);
  const [serviceAvailable, setServiceAvailable] = useState(true);

  // Settings
  const [model, setModel] = useState('sora-2');
  const [size, setSize] = useState('1280x720');
  const [targetDuration, setTargetDuration] = useState(180);
  const [sceneLength, setSceneLength] = useState(30);
  const [voice, setVoice] = useState('nova');
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState(null);
  const [previewAudio, setPreviewAudio] = useState(null);

  // History
  const [videoHistory, setVideoHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/ai/video/status`).then(r => r.ok ? r.json() : null).then(d => { if (d) setServiceAvailable(d.available); }).catch(() => setServiceAvailable(false));
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/video/history?limit=10`);
      if (res.ok) { const d = await res.json(); setVideoHistory(d.videos || []); }
    } catch {}
    setHistoryLoading(false);
  };

  const handleVoicePreview = async (voiceId) => {
    if (previewingVoice === voiceId && previewAudio) {
      previewAudio.pause(); previewAudio.currentTime = 0; setPreviewingVoice(null); setPreviewAudio(null); return;
    }
    if (previewAudio) { previewAudio.pause(); previewAudio.currentTime = 0; }
    setPreviewingVoice(voiceId);
    try {
      const res = await fetch(`${API_URL}/api/tts/generate-base64`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: "Hello, this is a preview of my voice.", voice: voiceId, speed: 1.0 })
      });
      if (!res.ok) throw new Error('Failed');
      const d = await res.json();
      const audio = new Audio(`data:audio/mpeg;base64,${d.audio}`);
      setPreviewAudio(audio);
      audio.onended = () => { setPreviewingVoice(null); setPreviewAudio(null); };
      audio.play();
    } catch { setPreviewingVoice(null); setPreviewAudio(null); }
  };

  // Step 1: AI splits prompt into scenes
  const handleSplitScenes = async () => {
    if (!prompt.trim()) { toast({ variant: 'destructive', title: 'Enter a video concept first' }); return; }
    setSplitting(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/video/split-scenes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, target_duration: targetDuration, scene_length: sceneLength })
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed'); }
      const d = await res.json();
      setScenes(d.scenes || []);
      setStep('scenes');
      toast({ title: `${d.scene_count} scenes created!` });
    } catch (e) { toast({ variant: 'destructive', title: 'Failed to split scenes', description: e.message }); }
    finally { setSplitting(false); }
  };

  // Step 2: Generate all scenes in parallel
  const handleGenerateScenes = async () => {
    if (scenes.length < 2) { toast({ variant: 'destructive', title: 'Need at least 2 scenes' }); return; }
    setStep('generating');
    setGenerating(true);
    setProgress(0);
    setVideoData(null);

    try {
      const res = await fetch(`${API_URL}/api/ai/video/generate-scenes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes, model, size, voice })
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed'); }
      const d = await res.json();
      const jobId = d.job_id;
      setScenesTotal(d.scene_count);

      toast({ title: `Generating ${d.scene_count} scenes in parallel...` });

      // Poll
      const interval = setInterval(async () => {
        try {
          const sr = await fetch(`${API_URL}/api/ai/video/job/${jobId}`);
          const sd = await sr.json();
          setProgress(sd.progress || 0);
          setProgressMsg(sd.message || '');
          setScenesDone(sd.scenes_done || 0);
          setScenesTotal(sd.scenes_total || scenes.length);

          if (sd.status === 'completed') {
            clearInterval(interval);
            setVideoData(sd);
            setGenerating(false);
            setStep('done');
            toast({ title: 'Video generated!' });
          } else if (sd.status === 'failed') {
            clearInterval(interval);
            setGenerating(false);
            setStep('scenes');
            toast({ variant: 'destructive', title: 'Generation failed', description: sd.error });
          }
        } catch {}
      }, 4000);

      setTimeout(() => { clearInterval(interval); if (generating) { setGenerating(false); setStep('scenes'); toast({ variant: 'destructive', title: 'Timeout' }); } }, 900000);
    } catch (e) {
      toast({ variant: 'destructive', title: e.message });
      setGenerating(false);
      setStep('scenes');
    }
  };

  const updateScene = (idx, field, value) => {
    setScenes(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const removeScene = (idx) => setScenes(prev => prev.filter((_, i) => i !== idx));

  const addScene = () => {
    setScenes(prev => [...prev, { scene_number: prev.length + 1, prompt: '', duration: sceneLength, transition: 'cut' }]);
  };

  const handleDownload = (videoB64, filename) => {
    const b64 = videoB64 || videoData?.video_base64;
    if (!b64) return;
    const link = document.createElement('a');
    link.href = `data:video/mp4;base64,${b64}`;
    link.download = filename || `munal-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Downloaded!' });
  };

  const handleSave = async () => {
    if (!videoData?.video_base64) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/video/history`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_base64: videoData.video_base64, prompt, duration: targetDuration, size, title: saveTitle || `${scenes.length}-scene video` })
      });
      if (res.ok) { toast({ title: 'Saved!' }); setShowSaveDialog(false); setSaveTitle(''); loadHistory(); }
    } catch {}
    setSaving(false);
  };

  const totalDur = scenes.reduce((sum, s) => sum + (s.duration || 30), 0);

  if (!serviceAvailable) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20"><CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Service Unavailable</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Video generation is not configured.</p>
          </CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Video Studio | Munal AI</title></Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-fuchsia-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-fuchsia-950/20">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-2xl shadow-lg shadow-fuchsia-500/30">
              <Video className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Video Studio</h1>
              <p className="text-gray-500 dark:text-gray-400">Create videos up to 5 minutes with AI scene generation</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white border-0"><Sparkles className="w-3 h-3 mr-1" />Sora 2</Badge>
              <Button variant="outline" onClick={() => setShowHistory(true)} className="gap-2" data-testid="history-btn"><History className="w-4 h-4" />History</Button>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-6" data-testid="pipeline-steps">
            {['prompt', 'scenes', 'generating', 'done'].map((s, i) => {
              const labels = ['Concept', 'Scenes', 'Generate', 'Done'];
              const icons = [Wand2, Layers, Film, CheckCircle];
              const Icon = icons[i];
              const active = step === s;
              const done = ['prompt', 'scenes', 'generating', 'done'].indexOf(step) > i;
              return (
                <React.Fragment key={s}>
                  {i > 0 && <div className={cn("flex-1 h-0.5 rounded", done ? "bg-fuchsia-500" : "bg-gray-200 dark:bg-gray-700")} />}
                  <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                    active ? "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 ring-2 ring-fuchsia-300" :
                    done ? "bg-fuchsia-500 text-white" : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                  )}>
                    <Icon className="w-3.5 h-3.5" /> {labels[i]}
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Settings */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings2 className="w-4 h-4" /> Settings</CardTitle></CardHeader>
                <CardContent className="space-y-5 pt-0">
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select value={model} onValueChange={setModel} disabled={generating}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sora-2"><div className="flex items-center gap-2"><Film className="w-4 h-4" /> Sora 2 <Badge variant="secondary" className="text-[10px]">Standard</Badge></div></SelectItem>
                        <SelectItem value="sora-2-pro"><div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> Sora 2 Pro <Badge className="text-[10px] bg-amber-500 text-white border-0">HD</Badge></div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Resolution</Label>
                    <Select value={size} onValueChange={setSize} disabled={generating}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1280x720"><div className="flex items-center gap-2"><RectangleHorizontal className="w-4 h-4" /> HD 720p (16:9)</div></SelectItem>
                        <SelectItem value="1792x1024"><div className="flex items-center gap-2"><RectangleHorizontal className="w-4 h-4" /> Widescreen (16:9)</div></SelectItem>
                        <SelectItem value="1024x1792"><div className="flex items-center gap-2"><RectangleVertical className="w-4 h-4" /> Portrait (9:16)</div></SelectItem>
                        <SelectItem value="1024x1024"><div className="flex items-center gap-2"><Square className="w-4 h-4" /> Square (1:1)</div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Duration</Label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {DURATION_OPTIONS.map(d => (
                        <Button key={d.value} variant={targetDuration === d.value ? 'default' : 'outline'} size="sm"
                          onClick={() => setTargetDuration(d.value)} disabled={generating}
                          className={cn("text-xs", targetDuration === d.value && "bg-gradient-to-r from-fuchsia-500 to-pink-500 border-0")}>
                          {d.label}
                        </Button>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400">~{Math.ceil(targetDuration / sceneLength)} scenes at {sceneLength}s each</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between"><Label>Scene Length</Label><span className="text-xs font-semibold text-fuchsia-600">{sceneLength}s</span></div>
                    <Slider value={[sceneLength]} onValueChange={([v]) => setSceneLength(v)} min={10} max={60} step={5} disabled={generating} />
                  </div>

                  <div className="space-y-2">
                    <Label>Voice</Label>
                    <div className="relative">
                      <button type="button" onClick={() => !generating && setVoiceOpen(!voiceOpen)}
                        className={cn("flex items-center justify-between w-full h-10 px-3 py-2 text-sm rounded-md border bg-background", voiceOpen ? "border-fuchsia-400 ring-1 ring-fuchsia-300" : "border-input", generating && "opacity-50 cursor-not-allowed")}>
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-fuchsia-500" />
                          <span>{VOICES.find(v => v.value === voice)?.name}</span>
                          <span className="text-xs text-gray-400">- {VOICES.find(v => v.value === voice)?.desc}</span>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", voiceOpen && "rotate-180")} />
                      </button>
                      {voiceOpen && (
                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white dark:bg-slate-900 shadow-lg py-1">
                          {VOICES.map(v => (
                            <div key={v.value} onClick={() => { setVoice(v.value); setVoiceOpen(false); }}
                              className={cn("flex items-center justify-between px-3 py-2 mx-1 rounded-md cursor-pointer",
                                voice === v.value ? "bg-fuchsia-50 dark:bg-fuchsia-950/30 text-fuchsia-700" : "hover:bg-gray-50 dark:hover:bg-slate-800")}>
                              <div className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full border-2", voice === v.value ? "border-fuchsia-500 bg-fuchsia-500" : "border-gray-300")} />
                                <span className="text-sm">{v.name}</span><span className="text-xs text-gray-400">- {v.desc}</span>
                              </div>
                              <button type="button" onClick={e => { e.stopPropagation(); handleVoicePreview(v.value); }}
                                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                                {previewingVoice === v.value ? <StopCircle className="w-4 h-4 text-fuchsia-500" /> : <Play className="w-4 h-4 text-gray-400" />}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/30 dark:to-pink-950/30 border-fuchsia-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-2 text-fuchsia-700"><Sparkles className="w-4 h-4 inline mr-1" />How It Works</h4>
                  <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5 list-decimal pl-4">
                    <li>Write your video concept</li>
                    <li>AI splits it into {Math.ceil(targetDuration / sceneLength)} visual scenes</li>
                    <li>Review & edit each scene prompt</li>
                    <li>All scenes generate in parallel</li>
                    <li>Auto-stitched into one video</li>
                  </ol>
                </CardContent>
              </Card>
            </div>

            {/* Center + Right: Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Step 1: Prompt */}
              {step === 'prompt' && (
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <Label className="text-base font-semibold">Describe your video</Label>
                    <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} disabled={splitting}
                      placeholder="A professional product launch video showcasing a new AI-powered app. Start with a sleek office environment, transition to product demo on screen, show diverse team collaborating, and end with the logo reveal..."
                      className="min-h-[160px] text-base" data-testid="video-concept-input" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{prompt.length}/2000</span>
                      <Button onClick={handleSplitScenes} disabled={splitting || !prompt.trim()}
                        className="gap-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700" data-testid="split-scenes-btn">
                        {splitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        {splitting ? 'AI is writing scenes...' : 'Generate Scene Script'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Scene Editor */}
              {step === 'scenes' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{scenes.length} Scenes</h2>
                      <p className="text-xs text-gray-400">Total: ~{totalDur}s ({Math.floor(totalDur/60)}m {totalDur%60}s)</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setStep('prompt')} className="gap-1"><ArrowRight className="w-3 h-3 rotate-180" /> Back</Button>
                      <Button variant="outline" size="sm" onClick={addScene} className="gap-1"><Plus className="w-3 h-3" /> Add Scene</Button>
                      <Button onClick={handleGenerateScenes} disabled={scenes.length < 2}
                        className="gap-2 bg-gradient-to-r from-fuchsia-600 to-pink-600" data-testid="generate-scenes-btn">
                        <Film className="w-4 h-4" /> Generate Video ({scenes.length} scenes)
                      </Button>
                    </div>
                  </div>

                  {scenes.map((scene, i) => (
                    <Card key={i} className="border-l-4" style={{ borderLeftColor: `hsl(${(i * 40) % 360}, 70%, 60%)` }} data-testid={`scene-${i}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center gap-1 pt-1">
                            <span className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">{i + 1}</span>
                            <GripVertical className="w-4 h-4 text-gray-300" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <Textarea value={scene.prompt} onChange={e => updateScene(i, 'prompt', e.target.value)}
                              rows={3} className="text-sm resize-none" placeholder="Describe this scene..." />
                            <div className="flex items-center gap-3 text-xs">
                              <div className="flex items-center gap-1.5">
                                <Timer className="w-3 h-3 text-gray-400" />
                                <select value={scene.duration} onChange={e => updateScene(i, 'duration', parseInt(e.target.value))}
                                  className="border rounded px-2 py-1 text-xs bg-background">
                                  {[10,15,20,25,30,40,50,60].map(d => <option key={d} value={d}>{d}s</option>)}
                                </select>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-400">Transition:</span>
                                <select value={scene.transition || 'cut'} onChange={e => updateScene(i, 'transition', e.target.value)}
                                  className="border rounded px-2 py-1 text-xs bg-background">
                                  {['cut', 'fade', 'dissolve'].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => removeScene(i)}><X className="w-3.5 h-3.5" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Step 3: Generating */}
              {step === 'generating' && (
                <Card className="overflow-hidden">
                  <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 aspect-video flex flex-col items-center justify-center text-white p-8">
                    <Loader2 className="w-16 h-16 animate-spin text-fuchsia-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{progressMsg || 'Generating scenes in parallel...'}</h3>
                    <p className="text-gray-400 text-sm mb-4">{scenesDone}/{scenesTotal} scenes complete</p>
                    <div className="w-80 mx-auto bg-slate-700 rounded-full h-3 mb-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-fuchsia-500 to-pink-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-gray-500">{Math.round(progress)}% — This may take several minutes</p>
                    {/* Scene progress dots */}
                    <div className="flex items-center gap-2 mt-6">
                      {Array.from({ length: scenesTotal }).map((_, i) => (
                        <div key={i} className={cn("w-3 h-3 rounded-full transition-all",
                          i < scenesDone ? "bg-fuchsia-500 scale-110" : "bg-slate-600"
                        )} />
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Step 4: Done */}
              {step === 'done' && videoData?.video_base64 && (
                <div className="space-y-4">
                  <Card className="overflow-hidden">
                    <div className={cn("relative bg-black", size === '1024x1792' ? 'aspect-[9/16] max-h-[600px]' : size === '1024x1024' ? 'aspect-square max-h-[500px]' : 'aspect-video')}>
                      <video src={`data:video/mp4;base64,${videoData.video_base64}`} controls autoPlay className="w-full h-full object-contain" />
                    </div>
                  </Card>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{scenes.length} scenes</Badge>
                    <Badge variant="secondary">~{totalDur}s</Badge>
                    <Badge variant="secondary">{(videoData.file_size / (1024*1024)).toFixed(1)} MB</Badge>
                    <div className="ml-auto flex gap-2">
                      <Button variant="outline" onClick={() => { setStep('scenes'); setVideoData(null); }} className="gap-1.5"><RefreshCw className="w-4 h-4" /> Re-edit</Button>
                      <Button variant="outline" onClick={() => setShowSaveDialog(true)} className="gap-1.5"><Save className="w-4 h-4" /> Save</Button>
                      <Button onClick={() => handleDownload()} className="gap-1.5 bg-gradient-to-r from-fuchsia-600 to-pink-600" data-testid="download-final-btn"><Download className="w-4 h-4" /> Download</Button>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full gap-2" onClick={() => { setStep('prompt'); setScenes([]); setVideoData(null); setPrompt(''); }}>
                    <Plus className="w-4 h-4" /> Create New Video
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Save className="w-5 h-5 text-fuchsia-500" />Save Video</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Video title" value={saveTitle} onChange={e => setSaveTitle(e.target.value)} />
            <p className="text-sm text-gray-500">{scenes.length} scenes, ~{totalDur}s, {size}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-fuchsia-500">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><History className="w-5 h-5 text-fuchsia-500" />Video History</DialogTitle></DialogHeader>
          <div className="space-y-3 py-4">
            {historyLoading ? <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" /></div> :
             videoHistory.length === 0 ? <div className="text-center py-8 text-gray-500"><Video className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>No saved videos</p></div> :
             videoHistory.map(v => (
              <Card key={v.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{v.title}</h4>
                    <p className="text-sm text-gray-500 truncate">{v.prompt}</p>
                    <div className="flex gap-4 mt-1 text-xs text-gray-400">
                      <span>{v.duration}s</span><span>{v.size}</span>
                      <span>{new Date(v.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={async () => {
                      const res = await fetch(`${API_URL}/api/ai/video/history/${v.id}`);
                      const d = await res.json();
                      setVideoData(d); setStep('done'); setShowHistory(false);
                    }}><Eye className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" onClick={async () => {
                      const res = await fetch(`${API_URL}/api/ai/video/history/${v.id}`);
                      const d = await res.json(); handleDownload(d.video_base64, `${v.title}.mp4`);
                    }}><Download className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" className="text-red-500" onClick={async () => {
                      await fetch(`${API_URL}/api/ai/video/history/${v.id}`, { method: 'DELETE' }); loadHistory();
                    }}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TextToVideoPage;
