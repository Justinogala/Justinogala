import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Database, Users, HardDrive, Trash2, RefreshCw, AlertTriangle,
  CheckCircle2, Clock, Loader2, Activity, Shield, FolderOpen, Wifi, WifiOff
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api';

const REFRESH_INTERVAL = 20;

const HealthBadge = ({ value, good, warn }) => {
  const color = value <= good ? 'bg-emerald-500/15 text-emerald-600 border-emerald-200'
    : value <= warn ? 'bg-amber-500/15 text-amber-600 border-amber-200'
    : 'bg-red-500/15 text-red-600 border-red-200';
  return <Badge className={color} variant="outline">{value}</Badge>;
};

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <Card className="border-border" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
    <CardContent className="p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-text-primary">{value ?? '-'}</p>
          <p className="text-xs text-text-secondary">{label}</p>
        </div>
      </div>
      {sub && <p className="text-xs text-text-secondary mt-2">{sub}</p>}
    </CardContent>
  </Card>
);

const CollectionRow = ({ name, count, maxCount }) => {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm text-text-secondary w-44 truncate capitalize">{name.replace(/_/g, ' ')}</span>
      <div className="flex-1"><Progress value={pct} className="h-2" /></div>
      <span className="text-sm font-mono text-text-primary w-16 text-right">{count.toLocaleString()}</span>
    </div>
  );
};

const AdminDataHealthPage = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/data-health/stats`);
      if (res.ok) setStats(await res.json());
      else throw new Error('Failed to load stats');
      setLastUpdated(new Date());
      setCountdown(REFRESH_INTERVAL);
    } catch {
      if (!silent) toast({ variant: 'destructive', title: 'Failed to load data health stats' });
    }
    if (!silent) setLoading(false);
  }, [toast]);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Auto-refresh countdown
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { loadStats(true); return REFRESH_INTERVAL; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, loadStats]);

  const runCleanup = async (type) => {
    setCleaning(type);
    try {
      const endpoint = type === 'orphans'
        ? '/api/admin/data-health/cleanup/orphaned-members'
        : '/api/admin/data-health/cleanup/stale-conversations?days=90';
      const res = await fetch(`${API_URL}${endpoint}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast({ title: `Cleanup complete: ${data.deleted} records removed` });
        loadStats();
      } else throw new Error('Cleanup failed');
    } catch {
      toast({ variant: 'destructive', title: 'Cleanup failed' });
    }
    setCleaning(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="data-health-loading">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!stats) return null;

  const { overview, collection_stats, orphaned_records, user_health, workspace_health, pending_actions, stale_data } = stats;
  const maxCol = Math.max(...Object.values(collection_stats || {}), 1);
  const sortedCols = Object.entries(collection_stats || {}).sort((a, b) => b[1] - a[1]);
  const userActivePct = user_health.total > 0 ? Math.round((user_health.active_last_30d / user_health.total) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="admin-data-health">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Health</h1>
          <p className="text-muted-foreground mt-1">Monitor database health, detect orphaned records, and clean up stale data.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">LIVE</span>
          </div>
          {lastUpdated && (
            <span className="text-xs text-slate-400">
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              autoRefresh ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-600" : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500"
            )} data-testid="data-health-auto-refresh">
            {autoRefresh ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {autoRefresh ? `${countdown}s` : 'Paused'}
          </button>
          <Button variant="outline" size="sm" onClick={() => loadStats(false)} disabled={loading} data-testid="data-health-refresh">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Database} label="Total Documents" value={overview.total_documents?.toLocaleString()} color="bg-indigo-500" />
        <StatCard icon={Users} label="Total Users" value={overview.total_users} color="bg-blue-500" />
        <StatCard icon={FolderOpen} label="Workspaces" value={overview.total_workspaces} color="bg-teal-500" />
        <StatCard icon={HardDrive} label="Collections" value={overview.total_collections} color="bg-violet-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Health Issues */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Health */}
          <Card data-testid="user-health-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" /> User Health</CardTitle>
              <CardDescription>{userActivePct}% of users active in the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                  <p className="text-2xl font-bold text-emerald-600">{user_health.active_last_30d}</p>
                  <p className="text-xs text-emerald-700">Active (30d)</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                  <p className="text-2xl font-bold text-amber-600">{user_health.inactive_30d_plus}</p>
                  <p className="text-xs text-amber-700">Inactive (30d+)</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                  <p className="text-2xl font-bold text-gray-600">{user_health.never_logged_in}</p>
                  <p className="text-xs text-gray-600">Never Logged In</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <p className="text-2xl font-bold text-blue-600">{user_health.total}</p>
                  <p className="text-xs text-blue-700">Total Users</p>
                </div>
              </div>
              <div className="mt-4">
                <Progress value={userActivePct} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{userActivePct}% user activation rate</p>
              </div>
            </CardContent>
          </Card>

          {/* Orphaned Records & Cleanup */}
          <Card data-testid="orphaned-records-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Orphaned Records</CardTitle>
              <CardDescription>Records referencing deleted workspaces or users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  {orphaned_records.workspace_members === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Workspace Members</p>
                    <p className="text-xs text-muted-foreground">
                      {orphaned_records.workspace_members === 0 ? 'No orphaned records' : `${orphaned_records.workspace_members} orphaned records found`}
                    </p>
                  </div>
                </div>
                <HealthBadge value={orphaned_records.workspace_members} good={0} warn={5} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  {stale_data.old_conversations_30d === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Stale Conversations (30d+)</p>
                    <p className="text-xs text-muted-foreground">{stale_data.old_conversations_30d} old conversations</p>
                  </div>
                </div>
                <HealthBadge value={stale_data.old_conversations_30d} good={10} warn={50} />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runCleanup('orphans')}
                  disabled={cleaning === 'orphans' || orphaned_records.workspace_members === 0}
                  data-testid="cleanup-orphans-btn"
                >
                  {cleaning === 'orphans' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Clean Orphaned Members
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runCleanup('stale')}
                  disabled={cleaning === 'stale'}
                  data-testid="cleanup-stale-btn"
                >
                  {cleaning === 'stale' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Clean Stale Conversations
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending Actions */}
          <Card data-testid="pending-actions-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-violet-500" /> Pending Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <span className="text-sm">Pending Time-Off</span>
                  <HealthBadge value={pending_actions.pending_time_off_requests} good={0} warn={5} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <span className="text-sm">Pending Swaps</span>
                  <HealthBadge value={pending_actions.pending_swap_requests} good={0} warn={3} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <span className="text-sm">Empty Workspaces</span>
                  <HealthBadge value={workspace_health.empty_workspaces} good={0} warn={3} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <span className="text-sm">Total Workspaces</span>
                  <Badge variant="outline">{workspace_health.total}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Collection Stats */}
        <div className="space-y-6">
          <Card data-testid="collection-stats-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-indigo-500" /> Collection Stats</CardTitle>
              <CardDescription>Document counts per collection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {sortedCols.map(([name, count]) => (
                <CollectionRow key={name} name={name} count={count} maxCount={maxCol} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDataHealthPage;
