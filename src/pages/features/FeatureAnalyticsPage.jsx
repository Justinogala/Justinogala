import React, { useState, useEffect } from 'react';
import { BarChart, TrendingUp, PieChart, Activity, Users, MessageSquare, FileCheck, Calendar, Shield, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';
import { getApiUrl } from '@/lib/api';

const API = getApiUrl();

const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

function LiveAnalyticsDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/analytics/platform-stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 aspect-video flex items-center justify-center">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  const { summary, module_usage, daily_activity } = stats;
  const maxModule = Math.max(...module_usage.map(m => m.value), 1);
  const totalModuleUsage = module_usage.reduce((sum, m) => sum + m.value, 0);
  const maxDaily = Math.max(...daily_activity.map(d => d.count), 1) || 1;

  const statCards = [
    { icon: Users, label: 'Users', value: summary.total_users, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
    { icon: Calendar, label: 'Meetings', value: summary.total_meetings, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { icon: MessageSquare, label: 'AI Chats', value: summary.total_ai_chats, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { icon: FileCheck, label: 'Approvals', value: summary.total_approvals, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { icon: Shield, label: 'Audit Logs', value: summary.total_audit_logs, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { icon: Layers, label: 'Workspaces', value: summary.total_workspaces, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  ];

  return (
    <div className="rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden" data-testid="live-analytics-dashboard">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Munal AI — Live Platform Analytics</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-gray-400">Live</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stat Cards Row */}
        <div className="grid grid-cols-3 gap-2">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50"
            >
              <div className={`w-7 h-7 rounded-md ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">{s.value.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 truncate">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Module Usage Bar Chart */}
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">Module Usage</p>
            <div className="space-y-1.5">
              {module_usage.map((m, i) => (
                <div key={m.name} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 w-16 truncate text-right">{m.name}</span>
                  <div className="flex-1 h-3.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(m.value / maxModule) * 100}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 w-6 text-right">{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Donut-style breakdown + Activity */}
          <div className="space-y-3">
            {/* Donut */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Breakdown</p>
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 36 36" className="w-16 h-16 flex-shrink-0">
                  {module_usage.filter(m => m.value > 0).reduce((acc, m, i) => {
                    const pct = (m.value / totalModuleUsage) * 100;
                    const currentOffset = 100 - acc.offset;
                    acc.elements.push(
                      <circle
                        key={m.name}
                        cx="18" cy="18" r="15.9155"
                        fill="none"
                        stroke={COLORS[i % COLORS.length]}
                        strokeWidth="3.5"
                        strokeDasharray={`${pct} ${100 - pct}`}
                        strokeDashoffset={currentOffset}
                        className="transition-all duration-1000"
                      />
                    );
                    acc.offset += pct;
                    return acc;
                  }, { offset: 0, elements: [] }).elements}
                  <text x="18" y="18.5" textAnchor="middle" className="text-[6px] fill-gray-900 dark:fill-white font-bold">{totalModuleUsage}</text>
                  <text x="18" y="22.5" textAnchor="middle" className="text-[3px] fill-gray-400">total</text>
                </svg>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {module_usage.filter(m => m.value > 0).slice(0, 5).map((m, i) => (
                    <div key={m.name} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[9px] text-gray-500 dark:text-gray-400">{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weekly Activity Sparkline */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">7-Day Activity</p>
              <div className="flex items-end gap-1 h-8">
                {daily_activity.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max((d.count / maxDaily) * 100, 8)}%` }}
                      transition={{ delay: 0.5 + i * 0.08, duration: 0.5 }}
                      className="w-full rounded-sm bg-violet-400 dark:bg-violet-500 min-h-[3px]"
                    />
                    <span className="text-[8px] text-gray-400">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const FeatureAnalyticsPage = () => {
  return (
    <FeaturePageLayout
      title="Analytics"
      subtitle="Deep Performance Insights"
      description="Make data-driven decisions with comprehensive analytics. Track meeting effectiveness, team engagement, and usage trends over time."
      heroComponent={<LiveAnalyticsDashboard />}
      benefits={[
        { icon: BarChart, title: "Usage Metrics", description: "Track total meeting hours and transcription volume." },
        { icon: TrendingUp, title: "Trend Analysis", description: "Identify patterns in team productivity over time." },
        { icon: PieChart, title: "Engagement Stats", description: "See who is participating and contributing most." }
      ]}
      features={[
        { title: "Custom Reports", description: "Generate PDF reports for management reviews." },
        { title: "Meeting ROI", description: "Estimate cost vs. value of time spent in meetings." },
        { title: "Visual Dashboards", description: "Beautiful, easy-to-read charts and graphs." },
        { title: "Data Export", description: "Export raw data to CSV for external analysis." }
      ]}
      useCases={[
        { title: "Productivity Tracking", description: "Ensure time is being spent on high-value activities." },
        { title: "Resource Planning", description: "Allocate software licenses based on actual usage." },
        { title: "Team Health Check", description: "Identify burnout risks from meeting overload." },
        { title: "Executive Reporting", description: "Demonstrate operational efficiency to leadership." }
      ]}
      prevFeature={{ name: "File Management", link: "/features/file-management" }}
      nextFeature={{ name: "Voice Chat", link: "/features/voice-chat" }}
    />
  );
};

export default FeatureAnalyticsPage;
