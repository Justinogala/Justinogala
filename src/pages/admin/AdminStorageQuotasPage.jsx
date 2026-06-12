import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  HardDrive, Search, Loader2, RefreshCw, Edit2, Check, X,
  Users, Crown, Sparkles, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { getApiUrl } from '@/lib/api';

const getToken = () => localStorage.getItem('admin_token') || '';

const AdminStorageQuotasPage = () => {
  const { toast } = useToast();
  const apiUrl = getApiUrl();
  const [users, setUsers] = useState([]);
  const [planDefaults, setPlanDefaults] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [editUser, setEditUser] = useState(null);
  const [customMB, setCustomMB] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      if (planFilter !== 'all') params.set('plan', planFilter);
      const res = await fetch(`${apiUrl}/api/storage/admin/quotas?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setPlanDefaults(data.plan_defaults || {});
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [apiUrl, search, planFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSetQuota = async () => {
    if (!editUser) return;
    const limitBytes = customMB ? parseInt(customMB) * 1024 * 1024 : null;
    try {
      const res = await fetch(`${apiUrl}/api/storage/admin/quotas/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ custom_limit: limitBytes }),
      });
      if (res.ok) {
        toast({ title: limitBytes ? `Custom quota set: ${customMB} MB` : 'Reset to plan default' });
        setEditUser(null);
        load();
      }
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const planColors = { Free: 'bg-gray-100 text-gray-700', Pro: 'bg-violet-100 text-violet-700', Enterprise: 'bg-amber-100 text-amber-700' };

  return (
    <div className="space-y-6" data-testid="admin-storage-quotas">
      <Helmet><title>Storage Quotas | Admin - Munal</title></Helmet>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-violet-500" /> Storage Quotas
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage per-user storage limits for AI file generation</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
      </div>

      {/* Plan Defaults Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="plan-defaults">
        {Object.entries(planDefaults).map(([plan, info]) => (
          <Card key={plan}>
            <CardContent className="p-4 text-center">
              <Badge className={cn('mb-2', planColors[plan])}>{plan}</Badge>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{info.formatted}</p>
              <p className="text-xs text-gray-400">default storage limit</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="quota-search" />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-32" data-testid="plan-filter">
            <SelectValue placeholder="All plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="Free">Free</SelectItem>
            <SelectItem value="Pro">Pro</SelectItem>
            <SelectItem value="Enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-12 gap-3 px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <div className="col-span-4">User</div>
            <div className="col-span-1">Plan</div>
            <div className="col-span-2">Usage</div>
            <div className="col-span-2">Limit</div>
            <div className="col-span-2">Progress</div>
            <div className="col-span-1">Action</div>
          </div>

          {users.map(u => {
            const q = u.quota || {};
            const pct = q.usage_pct || 0;
            const barColor = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500';
            return (
              <div key={u.id} className="grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:shadow-sm transition-all" data-testid={`quota-user-${u.id}`}>
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-xs font-bold">
                      {(u.name || u.email || '?')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.name || 'No name'}</p>
                    <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                  </div>
                </div>
                <div className="col-span-1">
                  <Badge variant="outline" className={cn('text-[10px]', planColors[u.plan])}>{u.plan}</Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{q.used_formatted || '0 B'}</p>
                  <p className="text-[10px] text-gray-400">{q.file_count || 0} files</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{q.limit_formatted || '100 MB'}</p>
                  {u.has_custom_limit && <Badge variant="outline" className="text-[9px] h-4 border-violet-300 text-violet-600">Custom</Badge>}
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <span className={cn('text-[11px] font-medium w-10 text-right', pct > 90 ? 'text-red-500' : 'text-gray-500')}>{pct}%</span>
                  </div>
                </div>
                <div className="col-span-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditUser(u); setCustomMB(u.has_custom_limit && q.limit ? String(Math.round(q.limit / (1024*1024))) : ''); }} data-testid={`edit-quota-${u.id}`}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}

          {users.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No users found</p>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 pt-2">Showing {users.length} of {total} users</p>
        </div>
      )}

      {/* Edit Quota Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-sm" data-testid="edit-quota-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-violet-500" /> Set Storage Quota
            </DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={editUser.avatar} />
                  <AvatarFallback className="bg-violet-500 text-white font-bold">{(editUser.name || '?')[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{editUser.name}</p>
                  <p className="text-xs text-gray-400">{editUser.email} — {editUser.plan} plan</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Current usage:</span><span className="font-medium">{editUser.quota?.used_formatted}</span></div>
                <div className="flex justify-between mt-1"><span className="text-gray-500">Current limit:</span><span className="font-medium">{editUser.quota?.limit_formatted}</span></div>
                <div className="flex justify-between mt-1"><span className="text-gray-500">Plan default:</span><span className="font-medium">{planDefaults[editUser.plan]?.formatted || '100 MB'}</span></div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom limit (MB)</label>
                <Input
                  type="number"
                  placeholder={`Plan default: ${planDefaults[editUser.plan]?.formatted || '100 MB'}`}
                  value={customMB}
                  onChange={e => setCustomMB(e.target.value)}
                  min="0"
                  className="mt-1"
                  data-testid="custom-quota-input"
                />
                <p className="text-[10px] text-gray-400 mt-1">Leave empty to use plan default. Enter 0 to reset.</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setCustomMB(''); handleSetQuota(); }} data-testid="reset-quota-btn">Reset to Default</Button>
            <Button onClick={handleSetQuota} className="bg-violet-600 hover:bg-violet-700 text-white" data-testid="save-quota-btn">Save Quota</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStorageQuotasPage;
