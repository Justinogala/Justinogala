import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { getApiUrl } from '@/lib/api';
import {
  Clock, ChevronLeft, ChevronRight, Download, FileText, Users, Timer,
  CalendarDays, BarChart3, ArrowUpRight, Loader2, User,
} from 'lucide-react';

const API = getApiUrl();

const PERIOD_OPTIONS = [
  { value: 'daily', label: 'Daily', icon: CalendarDays },
  { value: 'weekly', label: 'Weekly', icon: CalendarDays },
  { value: 'monthly', label: 'Monthly', icon: CalendarDays },
  { value: 'yearly', label: 'Yearly', icon: BarChart3 },
];

const TimeClockReportsPage = () => {
  const params = useParams();
  const workspaceId = params.workspaceId || params.id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [period, setPeriod] = useState('weekly');
  const [refDate, setRefDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState(null);
  const [exporting, setExporting] = useState(false);

  const userRole = (user?.role || '').toLowerCase().replace(' ', '_');
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isManager = userRole === 'manager';
  const canView = isAdmin || isManager;
  const canExport = isAdmin;

  // Fetch workspace info
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/workspaces/${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          setWorkspace(data.workspace || data);
        }
      } catch { /* silent */ }
    })();
  }, [workspaceId]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/time-clock/reports/${workspaceId}?period=${period}&date=${refDate}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load report' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Network error' });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, period, refDate, toast]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const navigateDate = (direction) => {
    const d = new Date(refDate);
    if (period === 'daily') d.setDate(d.getDate() + direction);
    else if (period === 'weekly') d.setDate(d.getDate() + 7 * direction);
    else if (period === 'monthly') d.setMonth(d.getMonth() + direction);
    else if (period === 'yearly') d.setFullYear(d.getFullYear() + direction);
    setRefDate(d.toISOString().split('T')[0]);
  };

  const handleExport = async () => {
    if (!canExport) {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'Only admins can generate reports' });
      return;
    }
    setExporting(true);
    try {
      const res = await fetch(`${API}/api/time-clock/reports/${workspaceId}/export?period=${period}&date=${refDate}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timeclock_${period}_${refDate}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast({ title: 'Success', description: 'Report downloaded' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Export failed' });
    } finally {
      setExporting(false);
    }
  };

  const formatDuration = (min) => {
    if (!min) return '0h 0m';
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const maxUserHours = report ? Math.max(...(report.user_summary || []).map(u => u.total_hours), 1) : 1;
  const maxDailyMin = report ? Math.max(...(report.daily_chart || []).map(d => d.minutes), 1) : 1;

  if (!canView) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="pt-8 pb-6 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-700">Access Restricted</h2>
            <p className="text-sm text-gray-500 mt-1">Only Admins and Managers can view time clock reports.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20" data-testid="time-clock-reports-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(`/workspace/${workspaceId}/shifts`)}
              className="mb-2 -ml-2 text-gray-500 hover:text-gray-700"
              data-testid="back-to-shifts-btn"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Shifts
            </Button>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="reports-page-title">Time Clock Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">{workspace?.name || 'Workspace'}</p>
          </div>
          <div className="flex items-center gap-2">
            {isManager && !isAdmin && (
              <Badge variant="outline" className="text-xs border-amber-300 text-amber-600 bg-amber-50">
                View Only
              </Badge>
            )}
            {canExport && (
              <Button
                onClick={handleExport}
                disabled={exporting || loading}
                variant="outline"
                className="h-9 text-sm"
                data-testid="export-report-btn"
              >
                {exporting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
                Export Report
              </Button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6" data-testid="report-controls">
          {/* Period Tabs */}
          <div className="flex bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={cn(
                  'px-3.5 py-1.5 rounded-md text-xs font-medium transition-all',
                  period === opt.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
                data-testid={`period-${opt.value}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Date Nav */}
          <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 shadow-sm">
            <button
              onClick={() => navigateDate(-1)}
              className="px-2.5 py-1.5 hover:bg-gray-50 rounded-l-lg transition-colors"
              data-testid="date-prev"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <input
              type="date"
              value={refDate}
              onChange={(e) => setRefDate(e.target.value)}
              className="text-xs font-medium text-gray-700 bg-transparent border-0 outline-none px-1 w-32 text-center"
              data-testid="date-picker"
            />
            <button
              onClick={() => navigateDate(1)}
              className="px-2.5 py-1.5 hover:bg-gray-50 rounded-r-lg transition-colors"
              data-testid="date-next"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Date Range Label */}
          {report && (
            <span className="text-xs text-gray-400 font-medium" data-testid="date-range-label">
              {report.start_date} — {report.end_date}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : report ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6" data-testid="report-summary-cards">
              {[
                { icon: Timer, label: 'Total Hours', value: `${report.total_hours}h`, color: 'from-indigo-500 to-purple-500' },
                { icon: FileText, label: 'Clock Entries', value: report.total_entries, color: 'from-blue-500 to-cyan-500' },
                { icon: Users, label: 'Team Members', value: report.user_summary?.length || 0, color: 'from-emerald-500 to-teal-500' },
                { icon: Clock, label: 'Avg/Person', value: report.user_summary?.length ? `${(report.total_hours / report.user_summary.length).toFixed(1)}h` : '0h', color: 'from-amber-500 to-orange-500' },
              ].map(s => (
                <Card key={s.label} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center', s.color)}>
                        <s.icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Daily Activity Chart */}
              {report.daily_chart?.length > 0 && (
                <Card data-testid="daily-chart-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-500" /> Daily Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-end gap-1" style={{ height: '140px' }}>
                      {report.daily_chart.map((d, i) => (
                        <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                          <span className="text-[9px] text-gray-400 font-medium">{d.hours}h</span>
                          <div
                            className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-400 min-h-[4px] transition-all"
                            style={{ height: `${Math.max((d.minutes / maxDailyMin) * 100, 4)}%` }}
                          />
                          <span className="text-[8px] text-gray-400 font-medium whitespace-nowrap">
                            {d.date.slice(5)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Team Member Breakdown */}
              {report.user_summary?.length > 0 && (
                <Card data-testid="team-breakdown-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-500" /> Team Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2.5">
                    {report.user_summary.map((u) => (
                      <div key={u.user_id} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-medium text-gray-700 truncate">{u.user_name}</span>
                            <span className="text-xs font-bold text-gray-900">{u.total_hours}h</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                              style={{ width: `${(u.total_hours / maxUserHours) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400">{u.total_entries} entries{u.active_entries > 0 ? ` (${u.active_entries} active)` : ''}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Detailed Entries Table */}
            <Card data-testid="entries-table-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" /> Detailed Entries
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {report.user_summary?.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">
                    No clock entries for this period.
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-2">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-2 px-3">Name</th>
                          <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-2 px-3">Clock In</th>
                          <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-2 px-3">Clock Out</th>
                          <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-2 px-3">Duration</th>
                          <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.user_summary?.flatMap(u =>
                          u.entries.map(e => (
                            <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center">
                                    <User className="w-3 h-3 text-indigo-500" />
                                  </div>
                                  <span className="text-xs font-medium text-gray-700">{u.user_name}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-xs text-gray-600">
                                {e.clock_in ? new Date(e.clock_in).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-xs text-gray-600">
                                {e.clock_out ? new Date(e.clock_out).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-xs text-right font-medium text-gray-800">
                                {e.status === 'completed' ? formatDuration(e.duration_minutes) : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-[10px]',
                                    e.status === 'active'
                                      ? 'border-green-300 text-green-600 bg-green-50'
                                      : 'border-gray-200 text-gray-500 bg-gray-50'
                                  )}
                                >
                                  {e.status === 'active' ? 'Active' : 'Completed'}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default TimeClockReportsPage;
