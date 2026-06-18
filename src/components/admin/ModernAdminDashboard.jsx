import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ComplianceScoreWidget from '@/components/admin/ComplianceScoreWidget';
import QuickActionsSection from '@/components/admin/QuickActionsSection';
import AdminAPIStatus from '@/components/admin/AdminAPIStatus';
import AdminIntegrationStatus from '@/components/admin/AdminIntegrationStatus';
import APIDocumentationSection from '@/components/admin/APIDocumentationSection';
import PaymentGatewayWidget from '@/components/admin/payment/PaymentGatewayWidget';
import {
  Users, CreditCard, Activity, ArrowRight, Settings, FileText,
  Package, Wifi, WifiOff, RefreshCw, Eye, Shield, UserPlus,
  AlertTriangle, LayoutGrid, Building2, TrendingUp, Clock,
  CheckCircle2, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

const REFRESH_INTERVAL = 15;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-xl text-sm">
      <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="capitalize">{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const ModernAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/dashboard/realtime`);
      if (res.ok) {
        setData(await res.json());
        setLastUpdated(new Date());
        setCountdown(REFRESH_INTERVAL);
      }
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      if (!silent) setTimeout(() => setLoading(false), 300);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const metrics = data ? [
    { title: 'Total Users', value: data.counts.total_users, icon: Users, color: 'blue', border: 'border-l-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600' },
    { title: 'Active Users', value: data.counts.active_users, icon: CheckCircle2, color: 'emerald', border: 'border-l-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600' },
    { title: 'Online Now', value: data.today.online_now, icon: Activity, color: 'violet', border: 'border-l-violet-500', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600', pulse: data.today.online_now > 0 },
    { title: 'Logins Today', value: data.today.logins, icon: Eye, color: 'amber', border: 'border-l-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600' },
  ] : [];

  const contentMetrics = data ? [
    { title: 'Workspaces', value: data.counts.workspaces, icon: Building2, text: 'text-indigo-500' },
    { title: 'Organizations', value: data.counts.organizations, icon: LayoutGrid, text: 'text-violet-500' },
    { title: 'Documents', value: data.counts.documents, icon: FileText, text: 'text-blue-500' },
    { title: 'Sheets', value: data.counts.sheets, icon: BarChart3, text: 'text-emerald-500' },
    { title: 'New Registrations', value: data.today.registrations, icon: UserPlus, text: 'text-pink-500' },
    { title: 'Failed Logins', value: data.today.failed_logins, icon: AlertTriangle, text: data.today.failed_logins > 0 ? 'text-red-500' : 'text-gray-400' },
  ] : [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-16" data-testid="admin-dashboard">
      {/* Header */}
      <motion.div variants={item} className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Overview of your platform performance and system health.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">LIVE</span>
          </div>
          {lastUpdated && <span className="text-xs text-slate-400">{format(lastUpdated, 'HH:mm:ss')}</span>}
          <button onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              autoRefresh ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-600" : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500"
            )} data-testid="auto-refresh-toggle">
            {autoRefresh ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {autoRefresh ? `${countdown}s` : 'Paused'}
          </button>
          <Button variant="outline" size="sm" onClick={() => fetchData(false)} data-testid="refresh-btn">
            <RefreshCw className={cn("w-4 h-4 mr-1.5", loading && "animate-spin")} /> Refresh
          </Button>
          <Link to="/admin/system-updates">
            <Button className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/25 gap-2" data-testid="dashboard-publish-version-btn">
              <Package className="w-4 h-4" /> Publish Version
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Security Compliance Score */}
      <motion.div variants={item}>
        <ComplianceScoreWidget />
      </motion.div>

      {/* Live Metrics */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <Card key={i} className={cn("border-l-4 shadow-sm hover:shadow-md transition-shadow", m.border)} data-testid={`metric-${m.title.toLowerCase().replace(/\s/g, '-')}`}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{m.title}</p>
                  <p className={cn("text-3xl font-bold", m.text)}>{m.value}</p>
                </div>
                <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center relative", m.bg)}>
                  <m.icon className={cn("w-5 h-5", m.text)} />
                  {m.pulse && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Platform Content Stats */}
      <motion.div variants={item}>
        <Card>
          <CardContent className="pt-5">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {contentMetrics.map((m, i) => (
                <div key={i} className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <m.icon className={cn("w-5 h-5 mx-auto mb-1.5", m.text)} />
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{m.value}</div>
                  <div className="text-[10px] text-slate-500">{m.title}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts — Weekly Activity + User Growth */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <Card data-testid="weekly-activity-chart">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-500" /> Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.weekly_activity?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.weekly_activity} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="logins" fill="#6366f1" radius={[4, 4, 0, 0]} name="Logins" />
                  <Bar dataKey="signups" fill="#10b981" radius={[4, 4, 0, 0]} name="Signups" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">Loading...</div>
            )}
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card data-testid="user-growth-chart">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> User Growth
              <span className="text-xs font-normal text-muted-foreground ml-auto bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">30 Days</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.user_growth?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.user_growth}>
                  <defs>
                    <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={6} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} fill="url(#userGrowthGrad)" name="Users" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">Loading...</div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Access Cards */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl p-6 text-white shadow-xl shadow-violet-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg"><Users className="w-6 h-6 text-white" /></div>
              <h3 className="text-lg font-bold">User Management</h3>
            </div>
            <p className="text-violet-100 mb-6 text-sm">Manage user accounts, roles, permissions, and subscription plans.</p>
            <Link to="/admin/users">
              <Button variant="secondary" className="w-full justify-between bg-white text-violet-700 hover:bg-violet-50 border-none">
                Manage Users <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Content & Reports</h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Review system reports, analytics, and generated content.</p>
          </div>
          <Link to="/admin/reports"><Button variant="outline" className="w-full justify-between">View Reports <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg"><Settings className="w-6 h-6 text-orange-600 dark:text-orange-400" /></div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">System Settings</h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Configure global settings, API integrations, and gateways.</p>
          </div>
          <Link to="/admin/settings"><Button variant="outline" className="w-full justify-between">Configure <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
        </div>
      </motion.div>

      {/* Recent Audit + Recent Users */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange-500" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {data?.recent_audit?.map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="outline" className={cn("text-[10px] shrink-0",
                        log.action?.includes('fail') ? 'border-red-300 text-red-600' :
                        log.action?.includes('login') ? 'border-emerald-300 text-emerald-600' :
                        log.action?.includes('register') ? 'border-blue-300 text-blue-600' :
                        'border-gray-300 text-gray-600'
                      )}>{log.action}</Badge>
                      <span className="text-xs text-slate-500 truncate">{log.user_email || 'System'}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                      {log.timestamp ? format(new Date(log.timestamp), 'MMM d, HH:mm') : ''}
                    </span>
                  </div>
                ))}
                {(!data?.recent_audit || data.recent_audit.length === 0) && (
                  <div className="text-center py-8 text-slate-400 text-sm">No recent activity</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-500" /> Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {data?.recent_users?.map((u, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-sm font-medium text-violet-600 shrink-0">
                        {(u.name || u.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{u.name}</p>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge variant="outline" className={cn("text-[10px]",
                        u.status === 'Active' ? 'border-emerald-300 text-emerald-600' : 'border-gray-300 text-gray-500'
                      )}>{u.plan || 'Free'}</Badge>
                      {u.created_at && <span className="text-[10px] text-slate-400">{format(new Date(u.created_at), 'MMM d')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* API Status + Integrations */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdminAPIStatus />
        <AdminIntegrationStatus />
      </motion.div>

      {/* Payment Gateway */}
      <motion.div variants={item}>
        <PaymentGatewayWidget />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <QuickActionsSection />
      </motion.div>

      {/* API Documentation */}
      <motion.div variants={item}>
        <APIDocumentationSection />
      </motion.div>
    </motion.div>
  );
};

export default ModernAdminDashboard;
