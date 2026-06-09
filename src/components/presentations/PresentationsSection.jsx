import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import offlineDB from '@/services/offlineDB';
import {
  Plus, Sparkles, Loader2, Trash2, Copy,
  MoreHorizontal, Pencil, Check, X, Search,
  LayoutTemplate, Presentation, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import PresentationEditor from './PresentationEditor';

const getToken = () => {
  try { return JSON.parse(localStorage.getItem('munal_sessions') || '{}').token || null; } catch { return null; }
};

const api = async (path, opts = {}) => {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/presentations${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
};

const TEMPLATES = [
  { id: 'pitch', title: 'Business Pitch', icon: '🚀', slides: [
    { id: 's1', layout: 'title', title: 'Company Name', subtitle: 'Tagline — One sentence about what you do', notes: '' },
    { id: 's2', layout: 'content', title: 'The Problem', body: 'Describe the problem you solve\nWho experiences this pain?\nHow big is the market?', notes: '' },
    { id: 's3', layout: 'content', title: 'Our Solution', body: 'What you built\nHow it works\nKey differentiators', notes: '' },
    { id: 's4', layout: 'content', title: 'Traction', body: 'Key metrics\nGrowth numbers\nNotable customers', notes: '' },
    { id: 's5', layout: 'content', title: 'Business Model', body: 'Revenue streams\nPricing\nUnit economics', notes: '' },
    { id: 's6', layout: 'content', title: 'The Ask', body: 'Funding amount\nUse of funds\nTimeline', notes: '' },
    { id: 's7', layout: 'section', title: 'Thank You', subtitle: 'Questions?', notes: '' },
  ]},
  { id: 'project-update', title: 'Project Update', icon: '📊', slides: [
    { id: 's1', layout: 'title', title: 'Project Update', subtitle: 'Week of [Date]', notes: '' },
    { id: 's2', layout: 'content', title: 'Summary', body: 'Overall status: On Track\nKey milestone reached\nNext deadline approaching', notes: '' },
    { id: 's3', layout: 'content', title: 'Completed This Week', body: 'Task 1 completed\nTask 2 completed\nTask 3 completed', notes: '' },
    { id: 's4', layout: 'content', title: 'In Progress', body: 'Ongoing work item 1\nOngoing work item 2', notes: '' },
    { id: 's5', layout: 'content', title: 'Blockers & Risks', body: 'Blocker 1 — mitigation plan\nRisk 1 — likelihood and impact', notes: '' },
    { id: 's6', layout: 'content', title: 'Next Week Plan', body: 'Priority 1\nPriority 2\nPriority 3', notes: '' },
  ]},
  { id: 'training', title: 'Training Session', icon: '🎓', slides: [
    { id: 's1', layout: 'title', title: 'Training: [Topic]', subtitle: 'Presented by [Name]', notes: '' },
    { id: 's2', layout: 'content', title: 'Learning Objectives', body: 'By the end, you will be able to:\nObjective 1\nObjective 2\nObjective 3', notes: '' },
    { id: 's3', layout: 'content', title: 'Key Concepts', body: 'Concept 1 explained\nConcept 2 explained\nConcept 3 explained', notes: '' },
    { id: 's4', layout: 'content', title: 'Walkthrough', body: 'Step 1\nStep 2\nStep 3', notes: '' },
    { id: 's5', layout: 'content', title: 'Practice Exercise', body: 'Try this yourself:\nExercise instructions here', notes: '' },
    { id: 's6', layout: 'content', title: 'Q&A / Resources', body: 'Documentation link\nSupport contact\nFurther reading', notes: '' },
  ]},
  { id: 'retro', title: 'Team Retrospective', icon: '🔄', slides: [
    { id: 's1', layout: 'title', title: 'Sprint Retrospective', subtitle: 'Sprint [Number] — [Dates]', notes: '' },
    { id: 's2', layout: 'content', title: 'What Went Well', body: 'Positive item 1\nPositive item 2\nPositive item 3', notes: '' },
    { id: 's3', layout: 'content', title: 'What Could Improve', body: 'Improvement area 1\nImprovement area 2', notes: '' },
    { id: 's4', layout: 'content', title: 'Action Items', body: 'Action 1 — Owner: [Name]\nAction 2 — Owner: [Name]', notes: '' },
    { id: 's5', layout: 'section', title: 'Let\'s Improve Together', subtitle: 'See you next sprint!', notes: '' },
  ]},
  { id: 'sales', title: 'Sales Report', icon: '💰', slides: [
    { id: 's1', layout: 'title', title: 'Sales Report', subtitle: '[Quarter/Month] [Year]', notes: '' },
    { id: 's2', layout: 'content', title: 'Revenue Summary', body: 'Total revenue: $X\nTarget: $Y\nAchievement: Z%', notes: '' },
    { id: 's3', layout: 'content', title: 'Top Deals', body: 'Deal 1 — $amount\nDeal 2 — $amount\nDeal 3 — $amount', notes: '' },
    { id: 's4', layout: 'content', title: 'Pipeline', body: 'Qualified leads: X\nProposals sent: Y\nExpected close: $Z', notes: '' },
    { id: 's5', layout: 'content', title: 'Next Quarter Focus', body: 'Target 1\nTarget 2\nNew initiative', notes: '' },
  ]},
];

const PresentationList = ({ onSelect, onTemplates, onCreateAI }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        const data = await api(`?search=${encodeURIComponent(search)}`);
        setItems(data);
        if (!search) await offlineDB.putAll('presentations', data);
      } else {
        let cached = await offlineDB.getAll('presentations');
        if (search) {
          const s = search.toLowerCase();
          cached = cached.filter(p => (p.title || '').toLowerCase().includes(s));
        }
        setItems(cached);
      }
    } catch (e) {
      try {
        let cached = await offlineDB.getAll('presentations');
        if (search) cached = cached.filter(p => (p.title || '').toLowerCase().includes(search.toLowerCase()));
        setItems(cached);
      } catch { console.error(e); }
    }
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => { await api(`/${id}`, { method: 'DELETE' }); load(); };
  const handleDuplicate = async (id) => { await api(`/${id}/duplicate`, { method: 'POST' }); load(); };
  const handleRename = async (id) => {
    if (!renameVal.trim()) return;
    await api(`/${id}`, { method: 'PUT', body: JSON.stringify({ title: renameVal }) });
    setRenaming(null); load();
  };
  const createBlank = async () => {
    const doc = await api('', { method: 'POST', body: JSON.stringify({ title: 'Untitled Presentation' }) });
    onSelect(doc.id);
  };

  return (
    <div data-testid="presentations-list">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Presentations</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create and edit slide presentations</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={onTemplates} data-testid="pres-templates-btn" className="gap-1.5">
            <LayoutTemplate className="w-4 h-4" /> Templates
          </Button>
          <Button variant="outline" size="sm" onClick={onCreateAI} data-testid="pres-create-ai-btn" className="gap-1.5">
            <Sparkles className="w-4 h-4" /> Create with AI
          </Button>
          <Button size="sm" onClick={createBlank} data-testid="pres-new-btn" className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5">
            <Plus className="w-4 h-4" /> New Presentation
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search presentations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" data-testid="pres-search" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Presentation className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-base font-medium">No presentations yet</p>
          <p className="text-sm mt-1">Create your first presentation to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(item => (
            <div key={item.id} className="group relative flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all cursor-pointer bg-white dark:bg-slate-900" onClick={() => onSelect(item.id)} data-testid={`pres-item-${item.id}`}>
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                <Presentation className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                {renaming === item.id ? (
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <Input value={renameVal} onChange={e => setRenameVal(e.target.value)} className="h-7 text-sm" autoFocus onKeyDown={e => e.key === 'Enter' && handleRename(item.id)} />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRename(item.id)}><Check className="w-3 h-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setRenaming(null)}><X className="w-3 h-3" /></Button>
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{item.title}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />{new Date(item.updated_at).toLocaleDateString()}
                      <span className="ml-2">{item.slide_count} slides</span>
                    </p>
                  </>
                )}
              </div>
              <div className="relative" onClick={e => e.stopPropagation()}>
                <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => setMenuOpen(menuOpen === item.id ? null : item.id)}><MoreHorizontal className="w-4 h-4" /></Button>
                {menuOpen === item.id && (
                  <div className="absolute right-0 top-9 w-36 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-50">
                    <button className="w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2" onClick={() => { setRenaming(item.id); setRenameVal(item.title); setMenuOpen(null); }}><Pencil className="w-3 h-3" /> Rename</button>
                    <button className="w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2" onClick={() => { handleDuplicate(item.id); setMenuOpen(null); }}><Copy className="w-3 h-3" /> Duplicate</button>
                    <button className="w-full px-3 py-2 text-xs text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2" onClick={() => { handleDelete(item.id); setMenuOpen(null); }}><Trash2 className="w-3 h-3" /> Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PresentationsSection = () => {
  const [view, setView] = useState('list');
  const [activeId, setActiveId] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAICreate, setShowAICreate] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [aiLoading, setAILoading] = useState(false);

  const openPres = (id) => { setActiveId(id); setView('editor'); };
  const goBack = () => { setView('list'); setActiveId(null); };

  const createFromTemplate = async (template) => {
    const doc = await api('', { method: 'POST', body: JSON.stringify({ title: template.title, slides: template.slides, template: template.id }) });
    setShowTemplates(false);
    openPres(doc.id);
  };

  const createWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setAILoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/presentations/ai-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      if (res.ok) { const data = await res.json(); openPres(data.id); }
    } catch (e) { console.error(e); }
    setAILoading(false);
    setShowAICreate(false);
    setAIPrompt('');
  };

  if (view === 'editor' && activeId) {
    return <PresentationEditor presId={activeId} onBack={goBack} />;
  }

  return (
    <>
      <PresentationList onSelect={openPres} onTemplates={() => setShowTemplates(true)} onCreateAI={() => setShowAICreate(true)} />

      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Presentation Templates</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => createFromTemplate(t)} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-all text-left" data-testid={`pres-template-${t.id}`}>
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.title}</span>
                  <p className="text-xs text-gray-400">{t.slides.length} slides</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAICreate} onOpenChange={setShowAICreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-500" /> Create with AI</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Describe the presentation you want:</p>
            <Input placeholder="e.g. Quarterly sales report for Q1 2026..." value={aiPrompt} onChange={e => setAIPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && createWithAI()} data-testid="pres-ai-prompt" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAICreate(false)}>Cancel</Button>
            <Button onClick={createWithAI} disabled={aiLoading || !aiPrompt.trim()} className="bg-violet-600 hover:bg-violet-700 text-white" data-testid="pres-ai-generate-btn">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PresentationsSection;
