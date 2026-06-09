import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import offlineDB from '@/services/offlineDB';
import {
  Plus, Sparkles, ArrowLeft, Loader2, Trash2, Copy,
  FileText, MoreHorizontal, Pencil, Check, X, Search,
  Download, LayoutTemplate, File, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import DocumentEditor from './DocumentEditor';

const getToken = () => {
  try {
    const session = JSON.parse(localStorage.getItem('munal_sessions') || '{}');
    return session.token || null;
  } catch { return null; }
};

const api = async (path, opts = {}) => {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/documents${path}`, {
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

const TEMPLATES = [
  { id: 'meeting-notes', title: 'Meeting Notes', icon: '📋', content: '<h1>Meeting Notes</h1><h2>Date: </h2><h2>Attendees</h2><ul><li></li></ul><h2>Agenda</h2><ol><li></li></ol><h2>Discussion</h2><p></p><h2>Action Items</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"></li></ul>' },
  { id: 'project-proposal', title: 'Project Proposal', icon: '📄', content: '<h1>Project Proposal</h1><h2>Executive Summary</h2><p>Brief overview of the proposed project...</p><h2>Objectives</h2><ul><li>Objective 1</li><li>Objective 2</li></ul><h2>Scope</h2><p></p><h2>Timeline</h2><table><tr><th>Phase</th><th>Duration</th><th>Deliverables</th></tr><tr><td>Phase 1</td><td></td><td></td></tr></table><h2>Budget</h2><p></p><h2>Conclusion</h2><p></p>' },
  { id: 'weekly-report', title: 'Weekly Report', icon: '📊', content: '<h1>Weekly Report</h1><h2>Week of: </h2><h2>Accomplishments</h2><ul><li></li></ul><h2>In Progress</h2><ul><li></li></ul><h2>Blockers</h2><ul><li></li></ul><h2>Next Week Plans</h2><ul><li></li></ul>' },
  { id: 'letter', title: 'Business Letter', icon: '✉️', content: '<p>[Your Name]<br>[Your Address]<br>[City, State ZIP]<br>[Date]</p><p>[Recipient Name]<br>[Recipient Title]<br>[Company Name]<br>[Address]</p><p>Dear [Name],</p><p></p><p>Sincerely,<br>[Your Name]</p>' },
  { id: 'sop', title: 'Standard Operating Procedure', icon: '📐', content: '<h1>Standard Operating Procedure</h1><h2>Purpose</h2><p></p><h2>Scope</h2><p></p><h2>Responsibilities</h2><ul><li></li></ul><h2>Procedure</h2><ol><li>Step 1</li><li>Step 2</li><li>Step 3</li></ol><h2>References</h2><p></p><h2>Revision History</h2><table><tr><th>Date</th><th>Version</th><th>Changes</th></tr><tr><td></td><td>1.0</td><td>Initial release</td></tr></table>' },
  { id: 'contract', title: 'Contract Template', icon: '📑', content: '<h1>Agreement Contract</h1><p><strong>This Agreement</strong> is entered into as of [Date] between:</p><p><strong>Party A:</strong> [Name/Company]<br><strong>Party B:</strong> [Name/Company]</p><h2>1. Purpose</h2><p></p><h2>2. Terms & Conditions</h2><p></p><h2>3. Compensation</h2><p></p><h2>4. Duration</h2><p></p><h2>5. Termination</h2><p></p><h2>6. Signatures</h2><p>Party A: _____________________ Date: _____</p><p>Party B: _____________________ Date: _____</p>' },
];

// ── Document List ──
const DocumentList = ({ onSelect, onCreateAI, onTemplates }) => {
  const [docs, setDocs] = useState([]);
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
        setDocs(data);
        // Cache for offline
        if (!search) await offlineDB.putAll('documents', data);
      } else {
        // Load from IndexedDB
        let cached = await offlineDB.getAll('documents');
        if (search) {
          const s = search.toLowerCase();
          cached = cached.filter(d => (d.title || '').toLowerCase().includes(s));
        }
        setDocs(cached);
      }
    } catch (e) {
      // Fallback to cache
      try {
        let cached = await offlineDB.getAll('documents');
        if (search) {
          const s = search.toLowerCase();
          cached = cached.filter(d => (d.title || '').toLowerCase().includes(s));
        }
        setDocs(cached);
      } catch { console.error(e); }
    }
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    await api(`/${id}`, { method: 'DELETE' });
    load();
  };

  const handleDuplicate = async (id) => {
    await api(`/${id}/duplicate`, { method: 'POST' });
    load();
  };

  const handleRename = async (id) => {
    if (!renameVal.trim()) return;
    await api(`/${id}`, { method: 'PUT', body: JSON.stringify({ title: renameVal }) });
    setRenaming(null);
    load();
  };

  const createBlank = async () => {
    const doc = await api('', { method: 'POST', body: JSON.stringify({ title: 'Untitled Document', content: '<p></p>' }) });
    onSelect(doc.id);
  };

  return (
    <div data-testid="documents-list">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Documents</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create and edit rich text documents</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={onTemplates} data-testid="doc-templates-btn" className="gap-1.5">
            <LayoutTemplate className="w-4 h-4" /> Templates
          </Button>
          <Button variant="outline" size="sm" onClick={onCreateAI} data-testid="doc-create-ai-btn" className="gap-1.5">
            <Sparkles className="w-4 h-4" /> Create with AI
          </Button>
          <Button size="sm" onClick={createBlank} data-testid="doc-new-btn" className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5">
            <Plus className="w-4 h-4" /> New Document
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="doc-search"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-base font-medium">No documents yet</p>
          <p className="text-sm mt-1">Create your first document to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {docs.map(doc => (
            <div
              key={doc.id}
              className="group relative flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all cursor-pointer bg-white dark:bg-slate-900"
              onClick={() => onSelect(doc.id)}
              data-testid={`doc-item-${doc.id}`}
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <File className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                {renaming === doc.id ? (
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <Input value={renameVal} onChange={e => setRenameVal(e.target.value)} className="h-7 text-sm" autoFocus onKeyDown={e => e.key === 'Enter' && handleRename(doc.id)} />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRename(doc.id)}><Check className="w-3 h-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setRenaming(null)}><X className="w-3 h-3" /></Button>
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{doc.title}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(doc.updated_at).toLocaleDateString()}
                      {doc.word_count > 0 && <span className="ml-2">{doc.word_count} words</span>}
                    </p>
                  </>
                )}
              </div>
              <div className="relative" onClick={e => e.stopPropagation()}>
                <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => setMenuOpen(menuOpen === doc.id ? null : doc.id)}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
                {menuOpen === doc.id && (
                  <div className="absolute right-0 top-9 w-36 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-50">
                    <button className="w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2" onClick={() => { setRenaming(doc.id); setRenameVal(doc.title); setMenuOpen(null); }}>
                      <Pencil className="w-3 h-3" /> Rename
                    </button>
                    <button className="w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2" onClick={() => { handleDuplicate(doc.id); setMenuOpen(null); }}>
                      <Copy className="w-3 h-3" /> Duplicate
                    </button>
                    <button className="w-full px-3 py-2 text-xs text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2" onClick={() => { handleDelete(doc.id); setMenuOpen(null); }}>
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
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

// ── Main Documents Section ──
const DocumentsSection = () => {
  const [view, setView] = useState('list'); // 'list' | 'editor'
  const [activeDocId, setActiveDocId] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAICreate, setShowAICreate] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [aiLoading, setAILoading] = useState(false);

  const openDoc = (id) => { setActiveDocId(id); setView('editor'); };
  const goBack = () => { setView('list'); setActiveDocId(null); };

  const createFromTemplate = async (template) => {
    const doc = await api('', { method: 'POST', body: JSON.stringify({ title: template.title, content: template.content, template: template.id }) });
    setShowTemplates(false);
    openDoc(doc.id);
  };

  const createWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setAILoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/documents/ai-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      if (res.ok) {
        const data = await res.json();
        openDoc(data.id);
      } else {
        // Fallback - create with the prompt as content
        const doc = await api('', { method: 'POST', body: JSON.stringify({ title: aiPrompt.slice(0, 50), content: `<h1>${aiPrompt}</h1><p>Start writing here...</p>` }) });
        openDoc(doc.id);
      }
    } catch (e) {
      const doc = await api('', { method: 'POST', body: JSON.stringify({ title: aiPrompt.slice(0, 50), content: `<h1>${aiPrompt}</h1><p>Start writing here...</p>` }) });
      openDoc(doc.id);
    }
    setAILoading(false);
    setShowAICreate(false);
    setAIPrompt('');
  };

  if (view === 'editor' && activeDocId) {
    return <DocumentEditor docId={activeDocId} onBack={goBack} />;
  }

  return (
    <>
      <DocumentList onSelect={openDoc} onTemplates={() => setShowTemplates(true)} onCreateAI={() => setShowAICreate(true)} />

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Document Templates</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => createFromTemplate(t)}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-all text-left"
                data-testid={`doc-template-${t.id}`}
              >
                <span className="text-2xl">{t.icon}</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.title}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Create Dialog */}
      <Dialog open={showAICreate} onOpenChange={setShowAICreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-500" /> Create with AI</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Describe the document you want to create:</p>
            <Input
              placeholder="e.g. Write a project proposal for a mobile app..."
              value={aiPrompt}
              onChange={e => setAIPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createWithAI()}
              data-testid="doc-ai-prompt"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAICreate(false)}>Cancel</Button>
            <Button onClick={createWithAI} disabled={aiLoading || !aiPrompt.trim()} className="bg-violet-600 hover:bg-violet-700 text-white" data-testid="doc-ai-generate-btn">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentsSection;
