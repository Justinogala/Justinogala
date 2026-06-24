import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Activity, Video, Shield, AlertTriangle, 
  Clock, Calendar, RefreshCw, Eye, Database,
  FileText, LayoutGrid, Building2, UserPlus, Bot,
  Wifi, WifiOff, ChevronRight, CircleDot
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getApiUrl, API_URL } from '@/lib/api';

const REFRESH_INTERVAL = 15; // seconds

const AdminMonitoringDashboard = () => {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [dashboardRes, healthRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/monitoring/dashboard`),
        fetch(`${API_URL}/api/admin/monitoring/system-health`)
      ]);
      if (dashboardRes.ok) setData(await dashboardRes.json());
      if (healthRes.ok) setSystemHealth(await healthRes.json());
      setLastUpdated(new Date());
      setCountdown(REFRESH_INTERVAL);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      if (!silent) toast({ variant: 'destructive', title: 'Failed to load monitoring data' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initial fetch
  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh countdown
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { fetchData(true); return REFRESH_INTERVAL; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchData]);

  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const isHealthy = systemHealth?.status === 'healthy';
  const dbConnected = systemHealth?.database?.connected;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" data-testid="admin-monitoring-dashboard">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Real-Time Monitoring</h1>
          <p className="text-slate-500 dark:text-slate-400">Live system status and user activity</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">LIVE</span>
          </div>

          {lastUpdated && (
            <span className="text-xs text-slate-400">
              Updated {format(lastUpdated, 'HH:mm:ss')}
            </span>
          )}

          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              autoRefresh
                ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400"
                : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500"
            )}
            data-testid="auto-refresh-toggle"
          >
            {autoRefresh ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {autoRefresh ? `${countdown}s` : 'Paused'}
          </button>

          <Button onClick={() => fetchData(false)} variant="outline" size="sm" data-testid="refresh-btn">
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* System Health */}
      <Card className={cn("border-2 transition-colors", isHealthy ? "border-emerald-500/30" : "border-red-500/30")} data-testid="system-health-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" /> System Health
            </CardTitle>
            <Badge variant={isHealthy ? 'default' : 'destructive'} className={isHealthy ? "bg-emerald-500" : ""}>
              {systemHealth?.status || 'Unknown'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <Database className={cn("w-5 h-5 mx-auto mb-2", dbConnected ? "text-emerald-500" : "text-red-500")} />
              <div className={cn("text-lg font-bold", dbConnected ? "text-emerald-600" : "text-red-600")}>
                {dbConnected ? 'Connected' : 'Disconnected'}
              </div>
              <div className="text-xs text-slate-500">Database</div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <LayoutGrid className="w-5 h-5 mx-auto mb-2 text-violet-500" />
              <div className="text-lg font-bold text-violet-600">{systemHealth?.database?.collections || 0}</div>
              <div className="text-xs text-slate-500">Collections</div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <Clock className="w-5 h-5 mx-auto mb-2 text-blue-500" />
              <div className="text-lg font-bold text-blue-600">{formatUptime(systemHealth?.uptime_seconds)}</div>
              <div className="text-xs text-slate-500">Uptime</div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <CircleDot className="w-5 h-5 mx-auto mb-2 text-amber-500" />
              <div className="text-lg font-bold text-amber-600">{systemHealth?.database?.name || 'N/A'}</div>
              <div className="text-xs text-slate-500">DB Name</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Online Users', value: data?.real_time?.online_users || 0, icon: Users, color: 'green', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600' },
          { label: 'Active Meetings', value: data?.real_time?.active_meetings || 0, icon: Video, color: 'violet', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600' },
          { label: 'Logins Today', value: data?.today?.logins || 0, icon: Activity, color: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600' },
          { label: 'Failed Logins', value: data?.today?.failed_logins || 0, icon: AlertTriangle, color: 'red', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600' },
        ].map((stat, i) => (
          <Card key={i} data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                  <p className={cn("text-3xl font-bold", stat.text)}>{stat.value}</p>
                </div>
                <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.text)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Statistics + Today's Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-500" /> User Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Total Users', value: data?.users?.total || 0, cls: 'bg-slate-50 dark:bg-slate-800' },
              { label: 'Active', value: data?.users?.active || 0, cls: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600' },
              { label: 'Suspended', value: data?.users?.suspended || 0, cls: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600' },
              { label: 'Disabled', value: data?.users?.disabled || 0, cls: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600' },
              { label: 'Breached Passwords', value: data?.users?.breached_passwords || 0, cls: (data?.users?.breached_passwords || 0) > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20', text: (data?.users?.breached_passwords || 0) > 0 ? 'text-red-600' : 'text-emerald-600' },
            ].map((row, i) => (
              <div key={i} className={cn("flex justify-between items-center p-3 rounded-lg", row.cls)}>
                <span className="text-sm text-slate-600 dark:text-slate-300">{row.label}</span>
                <span className={cn("text-lg font-bold", row.text)}>{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" /> Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'User Logins', value: data?.today?.logins || 0, cls: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600' },
              { label: 'Failed Attempts', value: data?.today?.failed_logins || 0, cls: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600' },
              { label: 'New Registrations', value: data?.today?.registrations || 0, cls: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600' },
              { label: 'Meetings Created', value: data?.today?.meetings || 0, cls: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600' },
              { label: 'AI Chat Sessions', value: data?.today?.ai_chats || 0, cls: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600' },
            ].map((row, i) => (
              <div key={i} className={cn("flex justify-between items-center p-3 rounded-lg", row.cls)}>
                <span className="text-sm text-slate-600 dark:text-slate-300">{row.label}</span>
                <span className={cn("text-lg font-bold", row.text)}>{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Content Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" /> Platform Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Documents', value: data?.content?.documents || 0, icon: FileText, color: 'text-blue-500' },
              { label: 'Sheets', value: data?.content?.sheets || 0, icon: LayoutGrid, color: 'text-emerald-500' },
              { label: 'Workspaces', value: data?.content?.workspaces || 0, icon: Building2, color: 'text-violet-500' },
              { label: 'Organizations', value: data?.content?.organizations || 0, icon: Building2, color: 'text-amber-500' },
            ].map((item, i) => (
              <div key={i} className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <item.icon className={cn("w-5 h-5 mx-auto mb-2", item.color)} />
                <div className="text-xl font-bold text-slate-900 dark:text-white">{item.value}</div>
                <div className="text-xs text-slate-500">{item.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Audit Logs + Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange-500" /> Recent Audit Logs
            </CardTitle>
            <CardDescription>Latest security and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
              <div className="space-y-2">
                {data?.recent_audit_logs?.map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg" data-testid={`audit-log-${i}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="outline" className={cn("text-[10px] shrink-0",
                        log.action?.includes('fail') ? 'border-red-300 text-red-600' :
                        log.action?.includes('login') ? 'border-emerald-300 text-emerald-600' :
                        log.action?.includes('register') ? 'border-blue-300 text-blue-600' :
                        'border-gray-300 text-gray-600'
                      )}>
                        {log.action}
                      </Badge>
                      <span className="text-xs text-slate-500 truncate">{log.user_email || log.ip_address || 'System'}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                      {log.timestamp ? format(new Date(log.timestamp), 'MMM d, HH:mm') : ''}
                    </span>
                  </div>
                ))}
                {(!data?.recent_audit_logs || data.recent_audit_logs.length === 0) && (
                  <div className="text-center py-8 text-slate-400 text-sm">No recent audit logs</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-500" /> Recent Registrations
            </CardTitle>
            <CardDescription>Latest users who joined</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
              <div className="space-y-2">
                {data?.recent_users?.map((u, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-sm font-medium text-violet-600 shrink-0">
                        {(u.name || u.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{u.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge variant="outline" className={cn("text-[10px]",
                        u.status === 'Active' ? 'border-emerald-300 text-emerald-600' : 'border-gray-300 text-gray-500'
                      )}>{u.status}</Badge>
                      {u.created_at && (
                        <span className="text-[10px] text-slate-400">
                          {format(new Date(u.created_at), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {(!data?.recent_users || data.recent_users.length === 0) && (
                  <div className="text-center py-8 text-slate-400 text-sm">No recent registrations</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminMonitoringDashboard;
