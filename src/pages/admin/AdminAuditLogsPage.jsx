import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ScrollText, Search, RefreshCw, Shield, AlertTriangle, Info,
  ChevronLeft, ChevronRight, Loader2, Filter, ShieldAlert,
  LogIn, UserCog, KeyRound, Database, Server
} from 'lucide-react';
import { API_URL } from '@/lib/api';

const SEVERITY_CONFIG = {
  info:     { color: 'bg-blue-500/10 text-blue-600 border-blue-200', icon: Info },
  warning:  { color: 'bg-amber-500/10 text-amber-600 border-amber-200', icon: AlertTriangle },
  critical: { color: 'bg-red-500/10 text-red-600 border-red-200', icon: ShieldAlert },
};

const CATEGORY_CONFIG = {
  auth:       { label: 'Auth', icon: LogIn, color: 'text-blue-500' },
  '2fa':      { label: '2FA', icon: Shield, color: 'text-violet-500' },
  permission: { label: 'Permission', icon: KeyRound, color: 'text-amber-500' },
  user_mgmt:  { label: 'User Mgmt', icon: UserCog, color: 'text-teal-500' },
  workspace:  { label: 'Workspace', icon: Database, color: 'text-indigo-500' },
  data:       { label: 'Data', icon: Database, color: 'text-gray-500' },
  system:     { label: 'System', icon: Server, color: 'text-slate-500' },
};

const formatTime = (ts) => {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
};

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-border">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </div>
);

const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '30', days: '30' });
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      if (severityFilter) params.set('severity', severityFilter);

      const res = await fetch(`${API_URL}/api/admin/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotalPages(data.total_pages);
        setTotal(data.total);
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    }
    setLoading(false);
  }, [page, search, categoryFilter, severityFilter]);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/audit-logs/stats?days=7`);
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error('Failed to load audit stats:', e);
    }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="admin-audit-logs">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Track admin actions, login attempts, and security events</p>
        </div>
        <Button variant="outline" onClick={() => { loadLogs(); loadStats(); }} disabled={loading} data-testid="audit-refresh">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3" data-testid="audit-stats">
          <StatCard label="Total (7d)" value={stats.total_events} icon={ScrollText} color="bg-indigo-500" />
          <StatCard label="Failed Logins" value={stats.failed_logins} icon={ShieldAlert} color="bg-red-500" />
          <StatCard label="Warnings" value={stats.by_severity?.warning || 0} icon={AlertTriangle} color="bg-amber-500" />
          <StatCard label="Critical" value={stats.by_severity?.critical || 0} icon={Shield} color="bg-rose-600" />
          <StatCard label="Auth Events" value={stats.by_category?.auth || 0} icon={LogIn} color="bg-blue-500" />
        </div>
      )}

      {/* Filters */}
      <Card data-testid="audit-filters">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search actions, emails..."
                className="pl-9"
                data-testid="audit-search-input"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              data-testid="audit-category-filter"
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              data-testid="audit-severity-filter"
            >
              <option value="">All Severity</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
            <Button type="submit" size="sm" data-testid="audit-search-btn">
              <Filter className="w-4 h-4 mr-1" /> Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card data-testid="audit-logs-table">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Events</CardTitle>
            <span className="text-sm text-muted-foreground">{total} total</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="audit-empty">
              <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No audit events found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, idx) => {
                const sev = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.info;
                const cat = CATEGORY_CONFIG[log.category] || CATEGORY_CONFIG.system;
                const SevIcon = sev.icon;
                const CatIcon = cat.icon;
                return (
                  <div
                    key={log.id || `${log.timestamp}-${idx}`}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    data-testid="audit-log-entry"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${sev.color}`}>
                      <SevIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{log.action}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          <CatIcon className={`w-3 h-3 mr-1 ${cat.color}`} />{cat.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {(log.actor_email || log.admin_email) && (
                          <span>by {log.actor_email || log.admin_email}</span>
                        )}
                        {log.target_email && <span>on {log.target_email}</span>}
                        {log.ip_address && <span>IP: {log.ip_address}</span>}
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {JSON.stringify(log.details).slice(0, 120)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                data-testid="audit-prev-page"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                data-testid="audit-next-page"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditLogsPage;
