import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import {
  Plus, Loader2, Trash2, Copy, MoreHorizontal, Search,
  FileSpreadsheet, Clock, Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import LinkToWorkspaceDialog from './LinkToWorkspaceDialog';

const getToken = () => {
  try { return JSON.parse(localStorage.getItem('munal_sessions') || '{}').token || null; } catch { return null; }
};

const WorkspaceSheets = ({ workspaceId }) => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);
  const [linkDialogItem, setLinkDialogItem] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/sheets?workspace_id=${workspaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        let data = await res.json();
        if (search) {
          const s = search.toLowerCase();
          data = data.filter(sh => (sh.title || '').toLowerCase().includes(s));
        }
        setSheets(data);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [workspaceId, search]);

  useEffect(() => { load(); }, [load]);

  const createSheet = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: 'Untitled Sheet', workspace_id: workspaceId }),
      });
      if (res.ok) {
        const sheet = await res.json();
        window.location.href = `/dochub?tab=sheets&sheet=${sheet.id}`;
      }
    } catch (e) { console.error(e); }
  };

  const deleteSheet = async (id) => {
    try {
      const token = getToken();
      await fetch(`${API_URL}/api/sheets/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      load();
    } catch (e) { console.error(e); }
  };

  const duplicateSheet = async (id) => {
    try {
      const token = getToken();
      await fetch(`${API_URL}/api/sheets/${id}/duplicate`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      load();
    } catch (e) { console.error(e); }
  };

  const openSheet = (id) => {
    window.location.href = `/dochub?tab=sheets&sheet=${id}`;
  };

  const isLinkedItem = (sheet) => {
    return (sheet.linked_workspaces || []).includes(workspaceId) && sheet.workspace_id !== workspaceId;
  };

  return (
    <div data-testid="workspace-sheets">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <Button size="sm" onClick={createSheet} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" data-testid="ws-sheet-new-btn">
          <Plus className="w-4 h-4" /> New Sheet
        </Button>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
      ) : sheets.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No workspace sheets yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sheets.map(sheet => (
            <div key={sheet.id} className="group relative flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer bg-white dark:bg-slate-900" onClick={() => openSheet(sheet.id)}>
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{sheet.title}</p>
                  {isLinkedItem(sheet) && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1 border-blue-300 text-blue-600 shrink-0" data-testid={`linked-badge-${sheet.id}`}>
                      <Link2 className="w-2.5 h-2.5 mr-0.5" />Linked
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(sheet.updated_at).toLocaleDateString()}</p>
              </div>
              <div className="relative" onClick={e => e.stopPropagation()}>
                <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => setMenuOpen(menuOpen === sheet.id ? null : sheet.id)}><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                {menuOpen === sheet.id && (
                  <div className="absolute right-0 top-8 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border py-1 z-50">
                    <button className="w-full px-3 py-1.5 text-xs text-left hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2" onClick={() => { setLinkDialogItem(sheet); setMenuOpen(null); }} data-testid={`link-ws-btn-${sheet.id}`}><Link2 className="w-3 h-3" /> Link to Workspace</button>
                    <button className="w-full px-3 py-1.5 text-xs text-left hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2" onClick={() => { duplicateSheet(sheet.id); setMenuOpen(null); }}><Copy className="w-3 h-3" /> Duplicate</button>
                    <button className="w-full px-3 py-1.5 text-xs text-left hover:bg-red-50 text-red-600 flex items-center gap-2" onClick={() => { deleteSheet(sheet.id); setMenuOpen(null); }}><Trash2 className="w-3 h-3" /> Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {linkDialogItem && (
        <LinkToWorkspaceDialog
          open={!!linkDialogItem}
          onClose={() => setLinkDialogItem(null)}
          itemId={linkDialogItem.id}
          itemType="sheets"
          currentWorkspaceId={workspaceId}
          linkedWorkspaces={linkDialogItem.linked_workspaces || []}
          onLinked={() => load()}
        />
      )}
    </div>
  );
};

export default WorkspaceSheets;
