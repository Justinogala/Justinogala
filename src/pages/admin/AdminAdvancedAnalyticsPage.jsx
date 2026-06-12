import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  Users, Video, FileText, Brain, TrendingUp, TrendingDown,
  BarChart3, Clock, Loader2, RefreshCw, Calendar, FileSpreadsheet,
  Presentation, MessageSquare, ArrowUpRight, ArrowDownRight, Minus,
  Image, FileDown, Trophy, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getApiUrl } from '@/lib/api';

const getToken = () => localStorage.getItem('admin_token') || '';

const TrendIndicator = ({ current, previous }) => {
  if (!previous || previous === 0) return <Minus className="w-3.5 h-3.5 text-gray-400" />;
  const pct = ((current - previous) / previous * 100).toFixed(1);
  const isUp = current > previous;
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', isUp ? 'text-emerald-600' : 'text-red-500')}>
      {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
      {Math.abs(pct)}%
    </span>
  );
};

const MiniChart = ({ data, dataKey = 'count', color = '#7c3aed', height = 48 }) => {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d[dataKey] || 0), 1);
  const w = 100 / data.length;
  return (
    <div className="flex items-end gap-[2px]" style={{ height }}>
      {data.map((d, i) => (
        <div
          key={i}
          className="rounded-sm transition-all hover:opacity-80"
          style={{
            width: `${w}%`,
            height: `${Math.max(((d[dataKey] || 0) / max) * 100, 4)}%`,
            backgroundColor: color,
            opacity: 0.3 + ((d[dataKey] || 0) / max) * 0.7,
          }}
          title={`${d.date || d.day || d.hour || ''}: ${d[dataKey] || 0}`}
        />
      ))}
    </div>
  );
};

const AdminAdvancedAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const apiUrl = getApiUrl();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/analytics/admin/overview?days=${period}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [apiUrl, period]);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  const { users, meetings, workspace, ai_usage, file_generation } = data;
  const fg = file_generation || { total: 0, this_period: 0, by_type: { images: {}, pdfs: {}, docx: {}, xlsx: {} }, top_generators: [], daily: [] };

  const statCards = [
    { label: 'Total Users', value: users.total, icon: Users, color: 'from-violet-500 to-purple-600', sub: `${users.new_this_period} new this period` },
    { label: 'Active Users', value: users.active, icon: TrendingUp, color: 'from-emerald-500 to-green-600', sub: `${users.suspended} suspended` },
    { label: 'Total Meetings', value: meetings.total, icon: Video, color: 'from-blue-500 to-cyan-600', sub: `${meetings.this_period} this period` },
    { label: 'AI Transcripts', value: meetings.transcripts, icon: FileText, color: 'from-amber-500 to-orange-600', sub: 'completed' },
    { label: 'Documents', value: workspace.documents, icon: FileText, color: 'from-sky-500 to-blue-600', sub: `${workspace.new_docs_period} new` },
    { label: 'Sheets', value: workspace.sheets, icon: FileSpreadsheet, color: 'from-emerald-500 to-teal-600', sub: `${workspace.new_sheets_period} new` },
    { label: 'Presentations', value: workspace.presentations, icon: Presentation, color: 'from-orange-500 to-red-600', sub: `${workspace.new_pres_period} new` },
    { label: 'AI Conversations', value: ai_usage.total_conversations, icon: Brain, color: 'from-pink-500 to-rose-600', sub: `${ai_usage.total_messages} messages` },
  ];

  return (
    <div className="space-y-6" data-testid="admin-advanced-analytics">
      <Helmet><title>Analytics | Admin - Munal</title></Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Advanced Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Platform performance and engagement insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]" data-testid="period-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load} data-testid="refresh-analytics-btn">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="analytics-stat-cards">
        {statCards.map((s, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', s.color)}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Signups */}
        <Card data-testid="signups-chart">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">User Signups</h3>
                <p className="text-xs text-gray-500">{users.new_this_period} new users this period</p>
              </div>
              <TrendIndicator current={users.new_this_period} previous={users.new_prev_period} />
            </div>
            <MiniChart data={users.signups_daily} color="#7c3aed" height={80} />
            <div className="flex justify-between mt-2 text-[10px] text-gray-400">
              {users.signups_daily?.length > 0 && (
                <>
                  <span>{users.signups_daily[0]?.date}</span>
                  <span>{users.signups_daily[users.signups_daily.length - 1]?.date}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Meetings Activity */}
        <Card data-testid="meetings-chart">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Meeting Activity</h3>
                <p className="text-xs text-gray-500">{meetings.this_period} meetings this period</p>
              </div>
              <BarChart3 className="w-4 h-4 text-blue-500" />
            </div>
            <MiniChart data={meetings.daily} color="#3b82f6" height={80} />
            <div className="flex justify-between mt-2 text-[10px] text-gray-400">
              {meetings.daily?.length > 0 && (
                <>
                  <span>{meetings.daily[0]?.date}</span>
                  <span>{meetings.daily[meetings.daily.length - 1]?.date}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Peak Hours + Content Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Meeting Hours */}
        <Card data-testid="peak-hours-chart">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Peak Meeting Hours
            </h3>
            {meetings.peak_hours?.length > 0 ? (
              <MiniChart data={meetings.peak_hours} color="#f59e0b" height={60} />
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">No meeting data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Content Created */}
        <Card data-testid="content-breakdown">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-500" /> Content Created
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Documents', count: workspace.documents, newCount: workspace.new_docs_period, color: 'bg-blue-500' },
                { label: 'Sheets', count: workspace.sheets, newCount: workspace.new_sheets_period, color: 'bg-emerald-500' },
                { label: 'Presentations', count: workspace.presentations, newCount: workspace.new_pres_period, color: 'bg-orange-500' },
              ].map((item, i) => {
                const maxVal = Math.max(workspace.documents, workspace.sheets, workspace.presentations, 1);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                      <span className="text-gray-500 text-xs">{item.count} total (+{item.newCount})</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', item.color)} style={{ width: `${(item.count / maxVal) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI File Generation Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-testid="file-generation-stats">
        {/* Generation Overview */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" /> AI File Generation
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{fg.total} files generated ({fg.this_period} this period)</p>
              </div>
            </div>

            {/* Type Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Images', icon: Image, total: fg.by_type.images?.total || 0, period: fg.by_type.images?.period || 0, color: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20' },
                { label: 'PDFs', icon: FileText, total: fg.by_type.pdfs?.total || 0, period: fg.by_type.pdfs?.period || 0, color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
                { label: 'Word', icon: FileDown, total: fg.by_type.docx?.total || 0, period: fg.by_type.docx?.period || 0, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
                { label: 'Excel', icon: FileSpreadsheet, total: fg.by_type.xlsx?.total || 0, period: fg.by_type.xlsx?.period || 0, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
              ].map((t, i) => (
                <div key={i} className="p-3 rounded-xl border border-gray-100 dark:border-slate-800 text-center">
                  <div className={cn('w-8 h-8 rounded-lg mx-auto flex items-center justify-center mb-2', t.color)}>
                    <t.icon className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{t.total}</p>
                  <p className="text-[10px] text-gray-400">{t.label}</p>
                  {t.period > 0 && <p className="text-[10px] text-emerald-500 mt-0.5">+{t.period} this period</p>}
                </div>
              ))}
            </div>

            {/* Daily Generation Trend */}
            {fg.daily?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">Generation Activity</p>
                <MiniChart data={fg.daily} color="#8b5cf6" height={60} />
                <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                  <span>{fg.daily[0]?.date}</span>
                  <span>{fg.daily[fg.daily.length - 1]?.date}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Generators */}
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-amber-500" /> Top File Generators
            </h3>
            {fg.top_generators?.length > 0 ? (
              <div className="space-y-3">
                {fg.top_generators.map((g, i) => {
                  const maxCount = fg.top_generators[0]?.count || 1;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0',
                            i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-gray-300'
                          )}>
                            {i + 1}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{g.user}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">{g.count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden ml-7">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
                          style={{ width: `${(g.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">No files generated yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAdvancedAnalytics;
