import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  Video, FileText, FileSpreadsheet, Presentation, Brain,
  Loader2, TrendingUp, Calendar, BarChart3, RefreshCw, Wifi, WifiOff
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/PageTransition';

const REFRESH_INTERVAL = 20;

const getToken = () => {
  try { return JSON.parse(localStorage.getItem('munal_sessions') || '{}').token || null; } catch { return null; }
};

const MiniBarChart = ({ data, barKey = 'meetings', color = '#7c3aed', height = 48 }) => {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => (d[barKey] || 0)), 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm transition-all"
            style={{
              height: `${Math.max(((d[barKey] || 0) / max) * 100, 6)}%`,
              backgroundColor: color,
              opacity: 0.4 + ((d[barKey] || 0) / max) * 0.6,
            }}
            title={`${d.day}: ${d[barKey] || 0}`}
          />
          <span className="text-[9px] text-gray-400">{d.day}</span>
        </div>
      ))}
    </div>
  );
};

const UserMyAnalyticsPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/analytics/user/my-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
    if (!silent) setLoading(false);
    setLastUpdated(new Date());
    setCountdown(REFRESH_INTERVAL);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { load(true); return REFRESH_INTERVAL; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, load]);

  if (loading && !stats) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      </PageTransition>
    );
  }

  const cards = stats ? [
    { label: 'Meetings', value: stats.meetings.total, icon: Video, color: 'from-blue-500 to-cyan-600', sub: `${stats.meetings.transcripts} transcripts` },
    { label: 'Documents', value: stats.content.documents, icon: FileText, color: 'from-violet-500 to-purple-600', sub: 'created' },
    { label: 'Sheets', value: stats.content.sheets, icon: FileSpreadsheet, color: 'from-emerald-500 to-teal-600', sub: 'created' },
    { label: 'Presentations', value: stats.content.presentations, icon: Presentation, color: 'from-orange-500 to-red-600', sub: 'created' },
    { label: 'AI Chats', value: stats.ai_usage.conversations, icon: Brain, color: 'from-pink-500 to-rose-600', sub: 'conversations' },
  ] : [];

  return (
    <PageTransition>
      <div className="p-6 md:p-8 max-w-5xl mx-auto" data-testid="user-my-analytics">
        <Helmet><title>My Analytics | Munal AI</title></Helmet>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-violet-500" /> My Analytics
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your personal activity and productivity insights</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">LIVE</span>
            </div>
            {lastUpdated && <span className="text-xs text-slate-400">{lastUpdated.toLocaleTimeString()}</span>}
            <button onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                autoRefresh ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-600" : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500"
              )} data-testid="analytics-auto-refresh">
              {autoRefresh ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {autoRefresh ? `${countdown}s` : 'Paused'}
            </button>
            <Button variant="outline" size="sm" onClick={() => load(false)} data-testid="analytics-refresh">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8" data-testid="user-stat-cards">
          {cards.map((c, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br mx-auto flex items-center justify-center mb-3', c.color)}>
                  <c.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{c.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{c.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activity Chart */}
        <Card data-testid="user-activity-chart">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-500" /> Activity This Week
            </h3>
            {stats?.activity_7d?.length > 0 ? (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">Meetings</p>
                  <MiniBarChart data={stats.activity_7d} barKey="meetings" color="#3b82f6" height={80} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">Documents Edited</p>
                  <MiniBarChart data={stats.activity_7d} barKey="documents" color="#7c3aed" height={80} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No activity data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default UserMyAnalyticsPage;
