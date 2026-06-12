import React, { useState, useEffect, useCallback } from 'react';
import {
  HardDrive, Trash2, Loader2, Image, FileText, FileSpreadsheet,
  ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, RefreshCw, FileDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api';

const getToken = () => {
  try { return JSON.parse(localStorage.getItem('munal_sessions') || '{}').token || null; } catch { return null; }
};

const typeConfig = {
  image: { icon: Image, label: 'Image', color: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20' },
  pdf: { icon: FileText, label: 'PDF', color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
  docx: { icon: FileDown, label: 'Word', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  xlsx: { icon: FileSpreadsheet, label: 'Excel', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
};

const StorageManagementSection = () => {
  const { toast } = useToast();
  const [quota, setQuota] = useState(null);
  const [files, setFiles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [typeFilter, setTypeFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    if (!token) { setLoading(false); return; }
    try {
      const params = new URLSearchParams({ sort: sortField, order: sortOrder, limit: '100' });
      if (typeFilter !== 'all') params.set('file_type', typeFilter);

      const [quotaRes, filesRes] = await Promise.all([
        fetch(`${API_URL}/api/storage/my-quota`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/storage/my-files?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (quotaRes.ok) setQuota(await quotaRes.json());
      if (filesRes.ok) {
        const data = await filesRes.json();
        setFiles(data.files || []);
        setTotal(data.total || 0);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [sortField, sortOrder, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete "${file.filename}"? This frees ${file.file_size_formatted || '0 B'}.`)) return;
    setDeleting(file.id);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/storage/my-files/${file.id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: 'File deleted', description: `Freed ${data.freed}` });
        load();
      } else {
        toast({ title: 'Error', description: 'Could not delete file', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
    setDeleting(null);
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(o => o === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
    return sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 text-violet-500" /> : <ArrowUp className="w-3 h-3 text-violet-500" />;
  };

  const pct = quota?.usage_pct || 0;
  const barColor = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-violet-500';

  return (
    <div className="space-y-6" data-testid="storage-management-section">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-violet-500" /> Storage Management
        </h2>
        <p className="text-sm text-gray-500 mt-1">View and manage your AI-generated files</p>
      </div>

      {/* Quota Overview */}
      {quota && (
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700" data-testid="storage-overview">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Storage used</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {quota.used_formatted} / {quota.limit_formatted}
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all duration-500', barColor)} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-gray-400">{quota.file_count} files</span>
            <span className={cn('text-xs font-medium', pct > 90 ? 'text-red-500' : 'text-gray-400')}>
              {quota.remaining_formatted} remaining ({pct}%)
            </span>
          </div>
        </div>
      )}

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32 h-9 text-sm" data-testid="file-type-filter">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="pdf">PDFs</SelectItem>
            <SelectItem value="docx">Word</SelectItem>
            <SelectItem value="xlsx">Excel</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-xs">
          <button onClick={() => toggleSort('created_at')} className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors', sortField === 'created_at' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500')}>
            Date <SortIcon field="created_at" />
          </button>
          <button onClick={() => toggleSort('file_size')} className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors', sortField === 'file_size' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500')}>
            Size <SortIcon field="file_size" />
          </button>
          <button onClick={() => toggleSort('type')} className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors', sortField === 'type' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500')}>
            Type <SortIcon field="type" />
          </button>
        </div>
        <Button variant="ghost" size="sm" onClick={load} className="ml-auto h-8"><RefreshCw className="w-3.5 h-3.5" /></Button>
      </div>

      {/* Files List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <HardDrive className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No generated files yet</p>
          <p className="text-xs mt-1">Files you generate in AI Chat will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map(file => {
            const config = typeConfig[file.type] || typeConfig.pdf;
            const Icon = config.icon;
            return (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 transition-all group"
                data-testid={`file-item-${file.id}`}
              >
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', config.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{file.filename}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">{config.label}</Badge>
                    <span className="text-[11px] text-gray-400">{file.file_size_formatted || '0 B'}</span>
                    <span className="text-[11px] text-gray-400">{new Date(file.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                  onClick={() => handleDelete(file)}
                  disabled={deleting === file.id}
                  data-testid={`delete-file-${file.id}`}
                >
                  {deleting === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </div>
            );
          })}
          <p className="text-center text-xs text-gray-400 pt-2">Showing {files.length} of {total} files</p>
        </div>
      )}
    </div>
  );
};

export default StorageManagementSection;
