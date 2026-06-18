import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, Video, Users, TrendingUp, Clock, 
  Calendar, RefreshCw, Download, Wifi, WifiOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

import { getApiUrl, API_URL } from '@/lib/api';

const REFRESH_INTERVAL = 20;

const AdminMeetingAnalytics = () => {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/analytics/meetings?days=${days}`);
      if (response.ok) {
        setData(await response.json());
        setLastUpdated(new Date());
        setCountdown(REFRESH_INTERVAL);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      if (!silent) toast({ variant: 'destructive', title: 'Failed to load analytics' });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [days, toast]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const maxMeetings = Math.max(...(data?.peak_hours?.map(h => h.count) || [1]));

  return (
    <div className="space-y-6 p-6" data-testid="admin-meeting-analytics">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Meeting Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Insights and statistics about meeting usage
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
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
            )} data-testid="meeting-auto-refresh">
            {autoRefresh ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {autoRefresh ? `${countdown}s` : 'Paused'}
          </button>
          <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => fetchData(false)} variant="outline" size="sm">
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Meetings</p>
                <p className="text-3xl font-bold text-violet-600">{data?.total_meetings || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Video className="w-6 h-6 text-violet-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              In the last {days} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Users</p>
                <p className="text-3xl font-bold text-blue-600">
                  {data?.meetings_per_user?.length || 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Users who created meetings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Avg per Day</p>
                <p className="text-3xl font-bold text-green-600">
                  {((data?.total_meetings || 0) / days).toFixed(1)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Meetings per day
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Meeting Creators
            </CardTitle>
            <CardDescription>Users with most meetings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.meetings_per_user?.slice(0, 10).map((user, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {user.user_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500">{user.user_email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {user.meeting_count} meetings
                  </Badge>
                </div>
              ))}
              {(!data?.meetings_per_user || data.meetings_per_user.length === 0) && (
                <div className="text-center py-8 text-slate-500">
                  No meeting data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Peak Meeting Hours
            </CardTitle>
            <CardDescription>When most meetings occur</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data?.peak_hours?.filter(h => h.count > 0).map((hour, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-slate-600 dark:text-slate-300">
                    {hour.hour.toString().padStart(2, '0')}:00
                  </span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all"
                      style={{ width: `${(hour.count / maxMeetings) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-medium">
                    {hour.count}
                  </span>
                </div>
              ))}
              {(!data?.peak_hours || data.peak_hours.filter(h => h.count > 0).length === 0) && (
                <div className="text-center py-8 text-slate-500">
                  No peak hour data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Meetings Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Daily Meeting Trend
          </CardTitle>
          <CardDescription>Meetings created per day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-1 px-4">
            {data?.daily_meetings?.slice(-30).map((day, index) => {
              const maxDaily = Math.max(...(data.daily_meetings?.map(d => d.count) || [1]));
              const height = (day.count / maxDaily) * 100;
              return (
                <div
                  key={index}
                  className="flex-1 group relative"
                >
                  <div
                    className="bg-gradient-to-t from-violet-600 to-purple-500 rounded-t transition-all hover:from-violet-500 hover:to-purple-400"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {format(new Date(day.date), 'MMM d')}: {day.count}
                  </div>
                </div>
              );
            })}
          </div>
          {(!data?.daily_meetings || data.daily_meetings.length === 0) && (
            <div className="text-center py-8 text-slate-500">
              No daily meeting data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMeetingAnalytics;
