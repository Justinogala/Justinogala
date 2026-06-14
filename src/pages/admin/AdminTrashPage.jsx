import React, { useState, useEffect, useCallback } from 'react';
import {
  Trash2, RotateCcw, AlertTriangle, Search, Loader2,
  Users, Building, Briefcase, Shield, Calendar, FileText,
  ClipboardList, ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { getApiUrl } from '@/lib/api';

const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'workspaces', label: 'Workspaces', icon: Building },
  { id: 'organizations', label: 'Organizations', icon: Briefcase },
  { id: 'approvals', label: 'Approvals', icon: ClipboardList },
  { id: 'approval_templates', label: 'Approval Templates', icon: ClipboardList },
  { id: 'incident_reports', label: 'IR/SOR Reports', icon: Shield },
  { id: 'ir_sor_templates', label: 'IR/SOR Templates', icon: Shield },
  { id: 'shifts', label: 'Shifts', icon: Calendar },
  { id: 'meetings', label: 'Meetings', icon: Calendar },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'presentations', label: 'Slides', icon: FileText },
  { id: 'sheets', label: 'Sheets', icon: FileText },
  { id: 'form_templates', label: 'Forms', icon: ClipboardList },
];

const AdminTrashPage = () => {
  const { toast } = useToast();
  const API = getApiUrl();
  const [activeTab, setActiveTab] = useState('users');
  const [summary, setSummary] = useState({});
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const getToken = () => localStorage.getItem('admin_token');

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/trash/summary`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) { const d = await res.json(); setSummary(d.summary || {}); }
    } catch {}
  }, [API]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/trash/${activeTab}?limit=100`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) {
        const d = await res.json();
        setItems(d.items || []);
        setTotal(d.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [API, activeTab]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { loadItems(); }, [loadItems]);

  const handleRestore = async (item) => {
    setActionLoading(item.id);
    try {
      const res = await fetch(`${API}/api/admin/trash/${item.type}/${item.id}/restore`, {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        toast({ title: "Restored", description: `${item.type_label} "${item.name}" has been restored.` });
        loadItems(); loadSummary();
      } else {
        const d = await res.json();
        toast({ title: "Error", description: d.detail || "Restore failed", variant: "destructive" });
      }
    } catch { toast({ title: "Error", description: "Network error", variant: "destructive" }); }
    setActionLoading(null);
  };

  const handlePermanentDelete = async (item) => {
    if (!window.confirm(`Permanently delete "${item.name}"? This action CANNOT be undone.`)) return;
    setActionLoading(item.id);
    try {
      const res = await fetch(`${API}/api/admin/trash/${item.type}/${item.id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        toast({ title: "Permanently Deleted", description: `${item.type_label} "${item.name}" has been permanently deleted.` });
        loadItems(); loadSummary();
      } else {
        const d = await res.json();
        toast({ title: "Error", description: d.detail || "Delete failed", variant: "destructive" });
      }
    } catch { toast({ title: "Error", description: "Network error", variant: "destructive" }); }
    setActionLoading(null);
  };

  const handleEmptyTrash = async () => {
    if (!window.confirm(`Permanently delete ALL ${activeTab.replace('_', ' ')} in trash? This CANNOT be undone.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/trash/${activeTab}/empty/all`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const d = await res.json();
        toast({ title: "Trash Emptied", description: `${d.deleted_count} items permanently deleted.` });
        loadItems(); loadSummary();
      }
    } catch { toast({ title: "Error", description: "Network error", variant: "destructive" }); }
    setLoading(false);
  };

  const filteredItems = searchQuery.trim()
    ? items.filter(i => i.name?.toLowerCase().includes(searchQuery.toLowerCase()) || i.extra?.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  const totalTrashed = Object.values(summary).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6" data-testid="admin-trash-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-red-500" /> Recycle Bin
          </h1>
          <p className="text-sm text-gray-500 mt-1">{totalTrashed} total items in trash across all categories</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const count = summary[tab.id] || 0;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                activeTab === tab.id
                  ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 border border-transparent"
              )}
              data-testid={`trash-tab-${tab.id}`}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {count > 0 && <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{count}</Badge>}
            </button>
          );
        })}
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search trashed items..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm" data-testid="trash-search" />
        </div>
        {items.length > 0 && (
          <Button variant="destructive" size="sm" onClick={handleEmptyTrash} data-testid="empty-trash-btn">
            <Trash2 className="w-4 h-4 mr-1.5" /> Empty {TABS.find(t => t.id === activeTab)?.label} Trash
          </Button>
        )}
      </div>

      {/* Items list */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <Trash2 className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500">No deleted {TABS.find(t => t.id === activeTab)?.label.toLowerCase()} found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredItems.map(item => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors" data-testid={`trash-item-${item.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                      <Badge variant="outline" className="text-[10px]">{item.type_label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                      {item.extra && <span>{item.extra}</span>}
                      {item.deleted_at && <span>Deleted {new Date(item.deleted_at).toLocaleDateString()}</span>}
                      {item.deleted_by && <span>by {item.deleted_by}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleRestore(item)}
                      disabled={actionLoading === item.id} data-testid={`restore-${item.id}`}
                      className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/20">
                      {actionLoading === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5 mr-1" />}
                      Restore
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handlePermanentDelete(item)}
                      disabled={actionLoading === item.id} data-testid={`delete-forever-${item.id}`}>
                      {actionLoading === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1" />}
                      Delete Forever
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 text-sm text-amber-700 dark:text-amber-400">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Permanent deletion is irreversible</p>
          <p className="text-xs mt-0.5 text-amber-600 dark:text-amber-500">Items deleted permanently cannot be recovered. All associated data (messages, members, files) will also be removed.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminTrashPage;
