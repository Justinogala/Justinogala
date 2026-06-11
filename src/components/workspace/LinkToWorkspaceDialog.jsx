import React, { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import { Link2, Loader2, Check, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

const getToken = () => {
  try { return JSON.parse(localStorage.getItem('munal_sessions') || '{}').token || null; } catch { return null; }
};

/**
 * Dialog to link a document/sheet/presentation to other workspaces.
 * @param {object} props
 * @param {boolean} props.open
 * @param {function} props.onClose
 * @param {string} props.itemId - The ID of the item to link
 * @param {string} props.itemType - "sheets" | "documents" | "presentations"
 * @param {string} props.currentWorkspaceId - Current workspace (excluded from options)
 * @param {string[]} props.linkedWorkspaces - Already linked workspace IDs
 * @param {function} props.onLinked - Callback after successful link/unlink
 */
const LinkToWorkspaceDialog = ({ open, onClose, itemId, itemType, currentWorkspaceId, linkedWorkspaces = [], onLinked }) => {
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      try {
        const token = getToken();
        const res = await fetch(`${API_URL}/api/workspaces`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setWorkspaces(Array.isArray(data) ? data : data.workspaces || []);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [open]);

  const filteredWorkspaces = workspaces.filter(w => {
    if (w.id === currentWorkspaceId) return false;
    if (!search) return true;
    return (w.name || '').toLowerCase().includes(search.toLowerCase());
  });

  const handleToggleLink = async (workspaceId) => {
    setLinking(workspaceId);
    const token = getToken();
    const isLinked = linkedWorkspaces.includes(workspaceId);

    try {
      if (isLinked) {
        const res = await fetch(`${API_URL}/api/${itemType}/${itemId}/unlink-workspace/${workspaceId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Unlink failed');
        toast({ title: 'Unlinked', description: 'Item removed from workspace' });
      } else {
        const res = await fetch(`${API_URL}/api/${itemType}/${itemId}/link-workspace`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ workspace_id: workspaceId }),
        });
        if (!res.ok) throw new Error('Link failed');
        toast({ title: 'Linked', description: 'Item linked to workspace' });
      }
      onLinked?.(workspaceId, !isLinked);
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setLinking(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="link-workspace-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-violet-500" />
            Link to Workspaces
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Share this item across multiple workspaces. Team members in linked workspaces will see it in their view.
        </p>

        {workspaces.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search workspaces..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
              data-testid="link-workspace-search"
            />
          </div>
        )}

        <div className="max-h-[300px] overflow-y-auto space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              {search ? 'No workspaces match your search' : 'No other workspaces available'}
            </div>
          ) : (
            filteredWorkspaces.map(ws => {
              const isLinked = linkedWorkspaces.includes(ws.id);
              return (
                <div
                  key={ws.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  data-testid={`workspace-link-option-${ws.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: ws.color || '#6366f1' }}>
                      {(ws.name || 'W')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{ws.name}</p>
                      {ws.member_count != null && (
                        <p className="text-xs text-slate-400">{ws.member_count} members</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isLinked ? 'default' : 'outline'}
                    className={isLinked ? 'bg-emerald-600 hover:bg-red-500 text-white text-xs h-7 px-2' : 'text-xs h-7 px-2'}
                    onClick={() => handleToggleLink(ws.id)}
                    disabled={linking === ws.id}
                    data-testid={`toggle-link-${ws.id}`}
                  >
                    {linking === ws.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isLinked ? (
                      <><Check className="w-3.5 h-3.5 mr-1" /> Linked</>
                    ) : (
                      <><Link2 className="w-3.5 h-3.5 mr-1" /> Link</>
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="link-dialog-close">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LinkToWorkspaceDialog;
