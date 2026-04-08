import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { API_URL } from '@/lib/api';
import {
  Plus, Sparkles, Save, ArrowLeft, Loader2, Trash2, Copy,
  FileSpreadsheet, MoreHorizontal, Pencil, Check, X, Search,
  MessageSquare, Wand2, Zap, Download, BarChart3, LayoutTemplate,
  Wallet, ClipboardList, Receipt, TrendingUp, Users, CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import SheetChatPanel from './SheetChatPanel';
import SheetInsightsPanel from './SheetInsightsPanel';
import { AIFormulaModal, SmartActionsModal } from './SheetAITools';

const getToken = () => {
  try {
    const session = JSON.parse(localStorage.getItem('munal_sessions') || '{}');
    return session.token || null;
  } catch { return null; }
};

const api = async (path, opts = {}) => {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/sheets${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...opts.headers,
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
};

// ── Sheet List View ──
const SheetList = ({ onSelect, onCreateAI, onTemplates }) => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('');
      setSheets(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const createBlank = async () => {
    try {
      const sheet = await api('', { method: 'POST', body: JSON.stringify({ title: 'Untitled Spreadsheet' }) });
      onSelect(sheet.id);
    } catch (e) { console.error(e); }
  };

  const deleteSheet = async (id) => {
    try {
      await api(`/${id}`, { method: 'DELETE' });
      setSheets(s => s.filter(x => x.id !== id));
      setMenuOpen(null);
    } catch (e) { console.error(e); }
  };

  const duplicateSheet = async (id) => {
    try {
      const copy = await api(`/${id}/duplicate`, { method: 'POST' });
      setSheets(s => [copy, ...s]);
      setMenuOpen(null);
    } catch (e) { console.error(e); }
  };

  const saveRename = async (id) => {
    if (!renameVal.trim()) return;
    try {
      await api(`/${id}`, { method: 'PUT', body: JSON.stringify({ title: renameVal }) });
      setSheets(s => s.map(x => x.id === id ? { ...x, title: renameVal } : x));
      setRenaming(null);
    } catch (e) { console.error(e); }
  };

  const filtered = sheets.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div data-testid="sheets-list-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Spreadsheets</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Create and manage AI-powered spreadsheets</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onTemplates} variant="outline" size="sm" className="gap-1.5 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" data-testid="templates-btn">
            <LayoutTemplate className="w-4 h-4" /> Templates
          </Button>
          <Button onClick={onCreateAI} variant="outline" size="sm" className="gap-1.5 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20" data-testid="create-ai-sheet-btn">
            <Sparkles className="w-4 h-4" /> Create with AI
          </Button>
          <Button onClick={createBlank} size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="create-blank-sheet-btn">
            <Plus className="w-4 h-4" /> Blank Sheet
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search spreadsheets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-9"
          data-testid="sheets-search"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" data-testid="sheets-empty-state">
          <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {search ? 'No spreadsheets match your search' : 'No spreadsheets yet'}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Create one with AI or start from a blank sheet
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="sheets-grid">
          {filtered.map(sheet => (
            <div
              key={sheet.id}
              className="group relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer"
              onClick={() => { if (!renaming && !menuOpen) onSelect(sheet.id); }}
              data-testid={`sheet-card-${sheet.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    {renaming === sheet.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={renameVal}
                          onChange={e => setRenameVal(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveRename(sheet.id); if (e.key === 'Escape') setRenaming(null); }}
                          className="h-7 text-sm"
                          autoFocus
                          onClick={e => e.stopPropagation()}
                        />
                        <button onClick={e => { e.stopPropagation(); saveRename(sheet.id); }} className="text-emerald-600"><Check className="w-4 h-4" /></button>
                        <button onClick={e => { e.stopPropagation(); setRenaming(null); }} className="text-gray-400"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{sheet.title}</p>
                    )}
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {new Date(sheet.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                {/* Actions */}
                <div className="relative">
                  <button
                    className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === sheet.id ? null : sheet.id); }}
                    data-testid={`sheet-menu-${sheet.id}`}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {menuOpen === sheet.id && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-50">
                      <button onClick={e => { e.stopPropagation(); setRenaming(sheet.id); setRenameVal(sheet.title); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                        <Pencil className="w-3.5 h-3.5" /> Rename
                      </button>
                      <button onClick={e => { e.stopPropagation(); duplicateSheet(sheet.id); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                        <Copy className="w-3.5 h-3.5" /> Duplicate
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteSheet(sheet.id); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// ── AI Generate Modal ──
const AIGenerateModal = ({ open, onClose, onGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [examples] = useState([
    'Monthly expense tracker with categories and totals',
    'Employee shift schedule for a week',
    'Sales pipeline with stages and revenue',
    'Project task tracker with deadlines and status',
    'Inventory management with stock levels',
    'Client contact list with company and phone',
  ]);

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const sheet = await api('/ai/generate', { method: 'POST', body: JSON.stringify({ prompt }) });
      onGenerated(sheet.id);
      setPrompt('');
      onClose();
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" data-testid="ai-generate-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            Create Spreadsheet with AI
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
              Describe the spreadsheet you need
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !generating) { e.preventDefault(); generate(); } }}
              placeholder="e.g., Create a monthly budget planner with income and expense categories..."
              className="w-full h-24 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
              data-testid="ai-prompt-input"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick examples:</p>
            <div className="flex flex-wrap gap-1.5">
              {examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(ex)}
                  className="px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  data-testid={`ai-example-${i}`}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={generating}>Cancel</Button>
          <Button
            onClick={generate}
            disabled={!prompt.trim() || generating}
            className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
            data-testid="ai-generate-btn"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Generating...' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


// ── Template Icon Mapping ──
const TEMPLATE_ICONS = {
  wallet: Wallet,
  clipboard: ClipboardList,
  receipt: Receipt,
  trending: TrendingUp,
  users: Users,
  calendar: CalendarDays,
};

// ── Template Picker Modal ──
const TemplatePicker = ({ open, onClose, onCreated }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(null);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await api('/templates/list');
        setTemplates(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [open]);

  const create = async (templateId) => {
    setCreating(templateId);
    try {
      const sheet = await api('/templates/create', {
        method: 'POST',
        body: JSON.stringify({ template_id: templateId }),
      });
      onCreated(sheet.id);
      onClose();
    } catch (e) { console.error(e); }
    setCreating(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl" data-testid="template-picker-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-emerald-500" />
            Smart Templates
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">
          Start with a pre-built template — fully editable with formulas and sample data
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2 max-h-[400px] overflow-y-auto">
            {templates.map(tpl => {
              const Icon = TEMPLATE_ICONS[tpl.icon] || FileSpreadsheet;
              const isCreating = creating === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => create(tpl.id)}
                  disabled={creating !== null}
                  className="flex flex-col items-start gap-2.5 p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md bg-white dark:bg-slate-800 transition-all text-left group disabled:opacity-50"
                  data-testid={`template-card-${tpl.id}`}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${tpl.color}15` }}
                  >
                    {isCreating ? (
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: tpl.color }} />
                    ) : (
                      <Icon className="w-5 h-5" style={{ color: tpl.color }} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {tpl.title}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {tpl.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};


// ── Sheet Editor View ──
const SheetEditor = ({ sheetId, onBack }) => {
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const saveTimerRef = useRef(null);
  const latestDataRef = useRef(null);
  const isInitializedRef = useRef(false);
  const changeCountRef = useRef(0);
  
  // Phase 2 state
  const [chatOpen, setChatOpen] = useState(false);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [smartActionsOpen, setSmartActionsOpen] = useState(false);
  const [copiedFormula, setCopiedFormula] = useState('');
  const [currentData, setCurrentData] = useState(null);
  // Phase 3 state
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const downloadSheet = async () => {
    setDownloading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/sheets/${sheetId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : 'spreadsheet.xlsx';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    setDownloading(false);
  };

  useEffect(() => {
    const loadSheet = async () => {
      setLoading(true);
      isInitializedRef.current = false;
      changeCountRef.current = 0;
      try {
        const data = await api(`/${sheetId}`);
        setSheet(data);
        setTitle(data.title);
        latestDataRef.current = data.data;
        // Allow Fortune-Sheet to settle before enabling auto-save
        setTimeout(() => { isInitializedRef.current = true; }, 3000);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    loadSheet();
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [sheetId]);

  const saveData = useCallback(async (dataToSave) => {
    if (!dataToSave || !Array.isArray(dataToSave)) return;
    // Check the data actually has content - prevent saving empty sheets
    const hasContent = dataToSave.some(s => {
      if (s.celldata && s.celldata.length > 0) return true;
      if (s.data && Array.isArray(s.data)) {
        return s.data.some(row => Array.isArray(row) && row.some(cell => cell != null));
      }
      return false;
    });
    if (!hasContent) return;
    setSaving(true);
    try {
      await api(`/${sheetId}`, {
        method: 'PUT',
        body: JSON.stringify({ data: dataToSave }),
      });
    } catch (e) { console.error('Save error:', e); }
    setSaving(false);
  }, [sheetId]);

  const handleChange = useCallback((data) => {
    latestDataRef.current = data;
    setCurrentData(data);
    changeCountRef.current += 1;
    // Skip auto-save during Fortune-Sheet initialization (first 3 onChange calls or before timeout)
    if (!isInitializedRef.current || changeCountRef.current <= 2) return;
    // Auto-save with debounce
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (latestDataRef.current) saveData(latestDataRef.current);
    }, 2000);
  }, [saveData]);

  const saveTitle = async () => {
    if (!title.trim()) return;
    try {
      await api(`/${sheetId}`, { method: 'PUT', body: JSON.stringify({ title }) });
      setSheet(s => ({ ...s, title }));
    } catch (e) { console.error(e); }
    setEditingTitle(false);
  };

  const manualSave = async () => {
    if (!latestDataRef.current) return;
    // Force save even during init - user explicitly requested
    setSaving(true);
    try {
      await api(`/${sheetId}`, {
        method: 'PUT',
        body: JSON.stringify({ data: latestDataRef.current }),
      });
    } catch (e) { console.error('Save error:', e); }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!sheet) {
    return <div className="text-center py-16 text-gray-500">Sheet not found</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]" data-testid="sheet-editor">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-gray-500" data-testid="sheet-back-btn">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="w-px h-5 bg-gray-200 dark:bg-slate-700" />
          {editingTitle ? (
            <div className="flex items-center gap-1">
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                className="h-8 text-sm font-medium w-64"
                autoFocus
                data-testid="sheet-title-input"
              />
              <button onClick={saveTitle} className="text-emerald-600"><Check className="w-4 h-4" /></button>
            </div>
          ) : (
            <button onClick={() => setEditingTitle(true)} className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" data-testid="sheet-title">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              {sheet.title}
              <Pencil className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs transition-opacity", saving ? "text-amber-500 opacity-100" : "text-emerald-500 opacity-70")}>
            {saving ? 'Saving...' : 'Saved'}
          </span>
          <div className="w-px h-5 bg-gray-200 dark:bg-slate-700" />
          <Button variant="outline" size="sm" onClick={() => setFormulaOpen(true)} className="gap-1 text-amber-600 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20" data-testid="ai-formula-btn" title="AI Formula Generator">
            <Wand2 className="w-3.5 h-3.5" /> Formula
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSmartActionsOpen(true)} className="gap-1 text-violet-600 border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/20" data-testid="smart-actions-btn" title="Smart AI Actions">
            <Zap className="w-3.5 h-3.5" /> Smart Actions
          </Button>
          <Button
            variant={chatOpen ? "default" : "outline"}
            size="sm"
            onClick={() => { setChatOpen(!chatOpen); if (!chatOpen) setInsightsOpen(false); }}
            className={cn("gap-1", chatOpen ? "bg-violet-600 hover:bg-violet-700 text-white" : "text-violet-600 border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/20")}
            data-testid="chat-with-data-btn"
            title="Chat with Data"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Chat
          </Button>
          <Button
            variant={insightsOpen ? "default" : "outline"}
            size="sm"
            onClick={() => { setInsightsOpen(!insightsOpen); if (!insightsOpen) setChatOpen(false); }}
            className={cn("gap-1", insightsOpen ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-emerald-600 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20")}
            data-testid="ai-insights-btn"
            title="AI Insights & Charts"
          >
            <BarChart3 className="w-3.5 h-3.5" /> Insights
          </Button>
          <div className="w-px h-5 bg-gray-200 dark:bg-slate-700" />
          <Button variant="outline" size="sm" onClick={downloadSheet} disabled={downloading} className="gap-1" data-testid="sheet-download-btn" title="Download as XLSX">
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Download
          </Button>
          <Button variant="outline" size="sm" onClick={manualSave} className="gap-1" data-testid="sheet-save-btn">
            <Save className="w-3.5 h-3.5" /> Save
          </Button>
        </div>
      </div>

      {/* Spreadsheet + Chat/Insights Panels */}
      <div className="flex flex-1 min-h-0 gap-0">
        <div className="flex-1 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900" data-testid="fortune-sheet-container">
          <Workbook
            data={sheet.data}
            onChange={handleChange}
            showToolbar={true}
            showFormulaBar={true}
            showSheetTabs={true}
            allowEdit={true}
            row={50}
            column={26}
          />
        </div>
        <SheetChatPanel
          sheetId={sheetId}
          sheetData={currentData || sheet.data}
          isOpen={chatOpen}
          onToggle={() => setChatOpen(false)}
        />
        <SheetInsightsPanel
          sheetId={sheetId}
          sheetData={currentData || sheet.data}
          isOpen={insightsOpen}
          onToggle={() => setInsightsOpen(false)}
        />
      </div>

      {/* Copied formula toast */}
      {copiedFormula && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-2" data-testid="formula-toast">
          <Check className="w-4 h-4" /> Formula copied: <code className="font-mono bg-emerald-700 px-1.5 rounded">{copiedFormula}</code>
        </div>
      )}

      {/* AI Modals */}
      <AIFormulaModal
        open={formulaOpen}
        onClose={() => setFormulaOpen(false)}
        onInsert={(formula) => {
          navigator.clipboard.writeText(formula).catch(() => {});
          setCopiedFormula(formula);
          setTimeout(() => setCopiedFormula(''), 3000);
        }}
      />
      <SmartActionsModal
        open={smartActionsOpen}
        onClose={() => setSmartActionsOpen(false)}
        sheetId={sheetId}
        selectedValues={(() => {
          const data = currentData || sheet.data;
          if (!data?.[0]?.celldata) return [];
          const cells = data[0].celldata;
          const textVals = cells
            .filter(c => c.r > 0 && c.v?.m && isNaN(Number(c.v.m)))
            .map(c => String(c.v.m))
            .slice(0, 20);
          return textVals;
        })()}
        onResult={(action, results) => {
          console.log(`Smart action ${action} results:`, results);
        }}
      />
    </div>
  );
};


// ── Main Sheets Section (DocHub tab) ──
const SheetsSection = () => {
  const [activeSheet, setActiveSheet] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  if (activeSheet) {
    return (
      <SheetEditor
        sheetId={activeSheet}
        onBack={() => setActiveSheet(null)}
      />
    );
  }

  return (
    <>
      <SheetList
        onSelect={setActiveSheet}
        onCreateAI={() => setShowAIModal(true)}
        onTemplates={() => setShowTemplates(true)}
      />
      <AIGenerateModal
        open={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerated={(id) => setActiveSheet(id)}
      />
      <TemplatePicker
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onCreated={(id) => setActiveSheet(id)}
      />
    </>
  );
};

export default SheetsSection;
