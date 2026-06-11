import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import {
  Video, FileText, FileSpreadsheet, Presentation, Brain,
  Loader2, TrendingUp, Calendar, BarChart3
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/PageTransition';

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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = getToken();
        const res = await fetch(`${API_URL}/api/analytics/user/my-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setStats(await res.json());
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading || !stats) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      </PageTransition>
    );
  }

  const cards = [
    { label: 'Meetings', value: stats.meetings.total, icon: Video, color: 'from-blue-500 to-cyan-600', sub: `${stats.meetings.transcripts} transcripts` },
    { label: 'Documents', value: stats.content.documents, icon: FileText, color: 'from-violet-500 to-purple-600', sub: 'created' },
    { label: 'Sheets', value: stats.content.sheets, icon: FileSpreadsheet, color: 'from-emerald-500 to-teal-600', sub: 'created' },
    { label: 'Presentations', value: stats.content.presentations, icon: Presentation, color: 'from-orange-500 to-red-600', sub: 'created' },
    { label: 'AI Chats', value: stats.ai_usage.conversations, icon: Brain, color: 'from-pink-500 to-rose-600', sub: 'conversations' },
  ];

  return (
    <PageTransition>
      <div className="p-6 md:p-8 max-w-5xl mx-auto" data-testid="user-my-analytics">
        <Helmet><title>My Analytics | Munal AI</title></Helmet>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-violet-500" /> My Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your personal activity and productivity insights</p>
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
            {stats.activity_7d?.length > 0 ? (
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
