import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { API_URL } from '@/lib/api';
import {
  Plus, Sparkles, Save, ArrowLeft, Loader2, Trash2, Copy,
  FileSpreadsheet, MoreHorizontal, Pencil, Check, X, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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
const SheetList = ({ onSelect, onCreateAI }) => {
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


// ── Sheet Editor View ──
const SheetEditor = ({ sheetId, onBack }) => {
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const saveTimerRef = useRef(null);
  const latestDataRef = useRef(null);

  useEffect(() => {
    const loadSheet = async () => {
      setLoading(true);
      try {
        const data = await api(`/${sheetId}`);
        setSheet(data);
        setTitle(data.title);
        latestDataRef.current = data.data;
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    loadSheet();
  }, [sheetId]);

  const saveData = useCallback(async (dataToSave) => {
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

  const manualSave = () => {
    if (latestDataRef.current) saveData(latestDataRef.current);
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
          <Button variant="outline" size="sm" onClick={manualSave} className="gap-1" data-testid="sheet-save-btn">
            <Save className="w-3.5 h-3.5" /> Save
          </Button>
        </div>
      </div>

      {/* Spreadsheet */}
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
    </div>
  );
};


// ── Main Sheets Section (DocHub tab) ──
const SheetsSection = () => {
  const [activeSheet, setActiveSheet] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);

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
      />
      <AIGenerateModal
        open={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerated={(id) => setActiveSheet(id)}
      />
    </>
  );
};

export default SheetsSection;
