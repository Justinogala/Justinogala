import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Save, Download, Loader2, Check, Plus, Trash2,
  Copy, ChevronUp, ChevronDown, Type, Columns, Layout, Square,
  Presentation as PresentationIcon
} from 'lucide-react';

const getToken = () => {
  try { return JSON.parse(localStorage.getItem('munal_sessions') || '{}').token || null; } catch { return null; }
};

const LAYOUTS = [
  { id: 'title', label: 'Title Slide', icon: Layout },
  { id: 'content', label: 'Content', icon: Type },
  { id: 'two-column', label: 'Two Columns', icon: Columns },
  { id: 'section', label: 'Section Header', icon: PresentationIcon },
  { id: 'blank', label: 'Blank', icon: Square },
];

const SlidePreview = ({ slide, index, isActive, onClick }) => (
  <div
    onClick={onClick}
    className={cn(
      "relative w-full aspect-video rounded-lg border-2 cursor-pointer transition-all overflow-hidden bg-white dark:bg-slate-800 p-2",
      isActive ? "border-violet-500 shadow-md" : "border-gray-200 dark:border-slate-700 hover:border-violet-300"
    )}
    data-testid={`slide-thumb-${index}`}
  >
    <div className="absolute top-1 left-1 text-[9px] font-mono text-gray-400 bg-white/80 dark:bg-slate-900/80 rounded px-1">{index + 1}</div>
    <div className="h-full flex flex-col items-center justify-center text-center overflow-hidden">
      {slide.layout === 'title' ? (
        <>
          <p className="text-[8px] font-bold text-gray-800 dark:text-white leading-tight truncate w-full">{slide.title || 'Title'}</p>
          <p className="text-[6px] text-gray-500 truncate w-full mt-0.5">{slide.subtitle || ''}</p>
        </>
      ) : slide.layout === 'section' ? (
        <>
          <p className="text-[8px] font-bold text-gray-800 dark:text-white truncate w-full">{slide.title || 'Section'}</p>
          <p className="text-[6px] text-gray-500 truncate w-full">{slide.subtitle || ''}</p>
        </>
      ) : (
        <>
          <p className="text-[7px] font-bold text-gray-800 dark:text-white truncate w-full text-left">{slide.title || 'Slide'}</p>
          <p className="text-[5px] text-gray-500 text-left w-full line-clamp-3 mt-0.5">{slide.body || slide.left || ''}</p>
        </>
      )}
    </div>
  </div>
);

const SlideCanvas = ({ slide, onChange }) => {
  if (!slide) return null;

  const update = (field, value) => onChange({ ...slide, [field]: value });

  return (
    <div className="w-full aspect-video bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 p-8 sm:p-12 flex flex-col" data-testid="slide-canvas">
      {slide.layout === 'title' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <input
            value={slide.title || ''}
            onChange={e => update('title', e.target.value)}
            placeholder="Presentation Title"
            className="text-2xl sm:text-4xl font-bold text-center bg-transparent border-none outline-none w-full text-gray-900 dark:text-white placeholder-gray-300"
            data-testid="slide-title-input"
          />
          <input
            value={slide.subtitle || ''}
            onChange={e => update('subtitle', e.target.value)}
            placeholder="Subtitle"
            className="text-base sm:text-xl text-center bg-transparent border-none outline-none w-full text-gray-500 dark:text-gray-400 placeholder-gray-300"
          />
        </div>
      )}
      {slide.layout === 'section' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
          <input
            value={slide.title || ''}
            onChange={e => update('title', e.target.value)}
            placeholder="Section Title"
            className="text-2xl sm:text-3xl font-bold text-center bg-transparent border-none outline-none w-full text-gray-900 dark:text-white placeholder-gray-300"
            data-testid="slide-title-input"
          />
          <input
            value={slide.subtitle || ''}
            onChange={e => update('subtitle', e.target.value)}
            placeholder="Subtitle"
            className="text-base sm:text-lg text-center bg-transparent border-none outline-none w-full text-gray-500 placeholder-gray-300"
          />
        </div>
      )}
      {slide.layout === 'content' && (
        <div className="flex-1 flex flex-col gap-4">
          <input
            value={slide.title || ''}
            onChange={e => update('title', e.target.value)}
            placeholder="Slide Title"
            className="text-xl sm:text-2xl font-bold bg-transparent border-none outline-none w-full text-gray-900 dark:text-white placeholder-gray-300"
            data-testid="slide-title-input"
          />
          <textarea
            value={slide.body || ''}
            onChange={e => update('body', e.target.value)}
            placeholder="Content (one bullet per line)"
            className="flex-1 text-sm sm:text-base bg-transparent border-none outline-none w-full text-gray-700 dark:text-gray-300 placeholder-gray-300 resize-none leading-relaxed"
            data-testid="slide-body-input"
          />
        </div>
      )}
      {slide.layout === 'two-column' && (
        <div className="flex-1 flex flex-col gap-4">
          <input
            value={slide.title || ''}
            onChange={e => update('title', e.target.value)}
            placeholder="Slide Title"
            className="text-xl sm:text-2xl font-bold bg-transparent border-none outline-none w-full text-gray-900 dark:text-white placeholder-gray-300"
            data-testid="slide-title-input"
          />
          <div className="flex-1 grid grid-cols-2 gap-4">
            <textarea
              value={slide.left || ''}
              onChange={e => update('left', e.target.value)}
              placeholder="Left column"
              className="text-sm bg-transparent border border-gray-200 dark:border-slate-700 rounded-lg p-3 outline-none w-full text-gray-700 dark:text-gray-300 resize-none"
            />
            <textarea
              value={slide.right || ''}
              onChange={e => update('right', e.target.value)}
              placeholder="Right column"
              className="text-sm bg-transparent border border-gray-200 dark:border-slate-700 rounded-lg p-3 outline-none w-full text-gray-700 dark:text-gray-300 resize-none"
            />
          </div>
        </div>
      )}
      {slide.layout === 'blank' && (
        <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">Blank slide</div>
      )}
    </div>
  );
};

const PresentationEditor = ({ presId, onBack }) => {
  const [pres, setPres] = useState(null);
  const [title, setTitle] = useState('');
  const [slides, setSlides] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const autoSaveTimer = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = getToken();
        const res = await fetch(`${API_URL}/api/presentations/${presId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setPres(data);
          setTitle(data.title);
          setSlides(data.slides || []);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [presId]);

  const save = useCallback(async (slidesData, titleData) => {
    setSaving(true);
    try {
      const token = getToken();
      await fetch(`${API_URL}/api/presentations/${presId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slides: slidesData || slides, title: titleData || title }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    setSaving(false);
  }, [presId, slides, title]);

  const triggerAutoSave = (newSlides) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => save(newSlides), 2000);
  };

  const updateSlide = (updated) => {
    const newSlides = slides.map((s, i) => i === activeSlide ? updated : s);
    setSlides(newSlides);
    triggerAutoSave(newSlides);
  };

  const addSlide = (layout = 'content') => {
    const newSlide = { id: `slide-${Date.now()}`, layout, title: '', body: '', subtitle: '', left: '', right: '', notes: '' };
    const newSlides = [...slides.slice(0, activeSlide + 1), newSlide, ...slides.slice(activeSlide + 1)];
    setSlides(newSlides);
    setActiveSlide(activeSlide + 1);
    triggerAutoSave(newSlides);
  };

  const deleteSlide = (idx) => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== idx);
    setSlides(newSlides);
    setActiveSlide(Math.min(activeSlide, newSlides.length - 1));
    triggerAutoSave(newSlides);
  };

  const duplicateSlide = (idx) => {
    const copy = { ...slides[idx], id: `slide-${Date.now()}` };
    const newSlides = [...slides.slice(0, idx + 1), copy, ...slides.slice(idx + 1)];
    setSlides(newSlides);
    setActiveSlide(idx + 1);
    triggerAutoSave(newSlides);
  };

  const moveSlide = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= slides.length) return;
    const newSlides = [...slides];
    [newSlides[idx], newSlides[newIdx]] = [newSlides[newIdx], newSlides[idx]];
    setSlides(newSlides);
    setActiveSlide(newIdx);
    triggerAutoSave(newSlides);
  };

  const exportPptx = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/presentations/${presId}/export/pptx`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${title || 'presentation'}.pptx`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="flex flex-col h-full" data-testid="presentation-editor">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="pres-back-btn"><ArrowLeft className="w-5 h-5" /></Button>
          <Input value={title} onChange={e => setTitle(e.target.value)} onBlur={() => save(slides, title)} className="text-lg font-semibold border-none shadow-none bg-transparent px-2 h-auto focus-visible:ring-0" data-testid="pres-title-input" />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {saved && <span className="text-xs text-emerald-500 flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>}
          {saving && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          <Button variant="outline" size="sm" onClick={() => save(slides, title)} data-testid="pres-save-btn" className="gap-1.5"><Save className="w-4 h-4" /> Save</Button>
          <Button variant="outline" size="sm" onClick={exportPptx} data-testid="pres-export-pptx" className="gap-1.5"><Download className="w-4 h-4" /> PPTX</Button>
        </div>
      </div>

      {/* Editor Layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Slide Panel */}
        <div className="w-40 lg:w-48 flex flex-col gap-2 overflow-y-auto pr-2 flex-shrink-0" data-testid="slide-panel">
          {slides.map((slide, idx) => (
            <div key={slide.id} className="relative group">
              <SlidePreview slide={slide} index={idx} isActive={idx === activeSlide} onClick={() => setActiveSlide(idx)} />
              <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); moveSlide(idx, -1); }} className="p-0.5 bg-white/90 dark:bg-slate-900/90 rounded text-gray-500 hover:text-violet-600"><ChevronUp className="w-3 h-3" /></button>
                <button onClick={(e) => { e.stopPropagation(); moveSlide(idx, 1); }} className="p-0.5 bg-white/90 dark:bg-slate-900/90 rounded text-gray-500 hover:text-violet-600"><ChevronDown className="w-3 h-3" /></button>
                <button onClick={(e) => { e.stopPropagation(); duplicateSlide(idx); }} className="p-0.5 bg-white/90 dark:bg-slate-900/90 rounded text-gray-500 hover:text-violet-600"><Copy className="w-3 h-3" /></button>
                <button onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }} className="p-0.5 bg-white/90 dark:bg-slate-900/90 rounded text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
          {/* Add Slide */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-2 mt-1">
            <p className="text-[10px] text-gray-400 mb-1 font-medium uppercase">Add slide</p>
            <div className="grid grid-cols-2 gap-1">
              {LAYOUTS.map(l => (
                <button key={l.id} onClick={() => addSlide(l.id)} className="flex flex-col items-center gap-0.5 p-1.5 rounded-md border border-gray-200 dark:border-slate-700 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all" data-testid={`add-slide-${l.id}`}>
                  <l.icon className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-[8px] text-gray-500">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <div className="w-full max-w-4xl">
            <SlideCanvas slide={slides[activeSlide]} onChange={updateSlide} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationEditor;
