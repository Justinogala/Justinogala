import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import {
  Plus, Loader2, Trash2, Copy,
  MoreHorizontal, Search,
  LayoutTemplate, File, Clock, Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import DocumentEditor from '@/components/documents/DocumentEditor';
import LinkToWorkspaceDialog from './LinkToWorkspaceDialog';

const getToken = () => {
  try { return JSON.parse(localStorage.getItem('munal_sessions') || '{}').token || null; } catch { return null; }
};

const api = async (path, opts = {}) => {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/documents${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
};

const TEMPLATES = [
  { id: 'meeting-notes', title: 'Meeting Notes', icon: '📋', content: '<h1>Meeting Notes</h1><h2>Date: </h2><h2>Attendees</h2><ul><li></li></ul><h2>Agenda</h2><ol><li></li></ol><h2>Discussion</h2><p></p><h2>Action Items</h2><ul><li></li></ul>' },
  { id: 'project-proposal', title: 'Project Proposal', icon: '📄', content: '<h1>Project Proposal</h1><h2>Executive Summary</h2><p></p><h2>Objectives</h2><ul><li></li></ul><h2>Scope</h2><p></p><h2>Timeline</h2><p></p>' },
  { id: 'weekly-report', title: 'Weekly Report', icon: '📊', content: '<h1>Weekly Report</h1><h2>Week of: </h2><h2>Accomplishments</h2><ul><li></li></ul><h2>In Progress</h2><ul><li></li></ul><h2>Blockers</h2><ul><li></li></ul>' },
  { id: 'sop', title: 'SOP', icon: '📐', content: '<h1>Standard Operating Procedure</h1><h2>Purpose</h2><p></p><h2>Procedure</h2><ol><li></li></ol><h2>References</h2><p></p>' },
];

const WorkspaceDocuments = ({ workspaceId }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list');
  const [activeDocId, setActiveDocId] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [linkDialogItem, setLinkDialogItem] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api(`?workspace_id=${workspaceId}&search=${encodeURIComponent(search)}`);
      setDocs(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [workspaceId, search]);

  useEffect(() => { load(); }, [load]);

  const createBlank = async () => {
    const doc = await api('', { method: 'POST', body: JSON.stringify({ title: 'Untitled Document', content: '<p></p>', workspace_id: workspaceId }) });
    setActiveDocId(doc.id);
    setView('editor');
  };

  const createFromTemplate = async (template) => {
    const doc = await api('', { method: 'POST', body: JSON.stringify({ title: template.title, content: template.content, workspace_id: workspaceId }) });
    setShowTemplates(false);
    setActiveDocId(doc.id);
    setView('editor');
  };

  const handleDelete = async (id) => { await api(`/${id}`, { method: 'DELETE' }); load(); };
  const handleDuplicate = async (id) => { await api(`/${id}/duplicate`, { method: 'POST' }); load(); };

  const isLinkedItem = (doc) => {
    return (doc.linked_workspaces || []).includes(workspaceId) && doc.workspace_id !== workspaceId;
  };

  if (view === 'editor' && activeDocId) {
    return <DocumentEditor docId={activeDocId} onBack={() => { setView('list'); setActiveDocId(null); load(); }} />;
  }

  return (
    <div data-testid="workspace-documents">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)} className="gap-1.5">
            <LayoutTemplate className="w-4 h-4" /> Templates
          </Button>
          <Button size="sm" onClick={createBlank} className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5" data-testid="ws-doc-new-btn">
            <Plus className="w-4 h-4" /> New Document
          </Button>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
      ) : docs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <File className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No workspace documents yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {docs.map(doc => (
            <div key={doc.id} className="group relative flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-violet-300 hover:shadow-sm transition-all cursor-pointer bg-white dark:bg-slate-900" onClick={() => { setActiveDocId(doc.id); setView('editor'); }}>
              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <File className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{doc.title}</p>
                  {isLinkedItem(doc) && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1 border-blue-300 text-blue-600 shrink-0" data-testid={`linked-badge-${doc.id}`}>
                      <Link2 className="w-2.5 h-2.5 mr-0.5" />Linked
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(doc.updated_at).toLocaleDateString()}</p>
              </div>
              <div className="relative" onClick={e => e.stopPropagation()}>
                <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => setMenuOpen(menuOpen === doc.id ? null : doc.id)}><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                {menuOpen === doc.id && (
                  <div className="absolute right-0 top-8 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border py-1 z-50">
                    <button className="w-full px-3 py-1.5 text-xs text-left hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2" onClick={() => { setLinkDialogItem(doc); setMenuOpen(null); }} data-testid={`link-ws-btn-${doc.id}`}><Link2 className="w-3 h-3" /> Link to Workspace</button>
                    <button className="w-full px-3 py-1.5 text-xs text-left hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2" onClick={() => { handleDuplicate(doc.id); setMenuOpen(null); }}><Copy className="w-3 h-3" /> Duplicate</button>
                    <button className="w-full px-3 py-1.5 text-xs text-left hover:bg-red-50 text-red-600 flex items-center gap-2" onClick={() => { handleDelete(doc.id); setMenuOpen(null); }}><Trash2 className="w-3 h-3" /> Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Document Templates</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => createFromTemplate(t)} className="flex items-center gap-2 p-3 rounded-xl border hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-all text-left">
                <span className="text-xl">{t.icon}</span>
                <span className="text-sm font-medium">{t.title}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {linkDialogItem && (
        <LinkToWorkspaceDialog
          open={!!linkDialogItem}
          onClose={() => setLinkDialogItem(null)}
          itemId={linkDialogItem.id}
          itemType="documents"
          currentWorkspaceId={workspaceId}
          linkedWorkspaces={linkDialogItem.linked_workspaces || []}
          onLinked={() => load()}
        />
      )}
    </div>
  );
};

export default WorkspaceDocuments;
