import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Clock, Users, TrendingUp, CalendarCheck, FileText, Bell, BarChart3, ArrowUpRight, ArrowDownRight, Timer, CalendarOff } from 'lucide-react';
import { motion } from 'framer-motion';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';
import { getApiUrl } from '@/lib/api';

const API = getApiUrl();

const ACCENT = ['#6366f1', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

function LiveDashboardWidget() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/analytics/platform-stats`).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/shifts/summary/all-workspaces`).then(r => r.json()).catch(() => null),
    ]).then(([stats, shiftSummary]) => {
      setData({ stats, shiftSummary });
    });
  }, []);

  if (!data || !data.stats) {
    return (
      <div className="rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 aspect-video flex items-center justify-center">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  const { summary, module_usage, daily_activity } = data.stats;
  const maxDaily = Math.max(...daily_activity.map(d => d.count), 1);

  const topCards = [
    { icon: Users, label: 'Team Members', value: summary.total_users, delta: '+12%', up: true, color: '#6366f1' },
    { icon: CalendarCheck, label: 'Active Meetings', value: summary.total_meetings, delta: '+8%', up: true, color: '#3b82f6' },
    { icon: Timer, label: 'Hours Tracked', value: summary.total_workspaces * 24, delta: '+15%', up: true, color: '#10b981' },
    { icon: FileText, label: 'Documents', value: summary.total_approvals + summary.total_audit_logs, delta: '-3%', up: false, color: '#f59e0b' },
  ];

  return (
    <div className="rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden" data-testid="live-dashboard-widget">
      {/* Header Bar */}
      <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Munal AI — Manager Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Real-time</span>
          </div>
          <div className="relative">
            <Bell className="w-4 h-4 text-gray-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Metric Cards */}
        <div className="grid grid-cols-4 gap-2">
          {topCards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${c.color}15` }}>
                  <c.icon className="w-3.5 h-3.5" style={{ color: c.color }} />
                </div>
                <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${c.up ? 'text-emerald-500' : 'text-red-400'}`}>
                  {c.up ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                  {c.delta}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{c.value.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{c.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Middle Row: Activity Chart + Notifications */}
        <div className="grid grid-cols-5 gap-3">
          {/* Activity Chart */}
          <div className="col-span-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Weekly Activity</p>
              <span className="text-[9px] text-gray-400 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">Last 7 days</span>
            </div>
            <div className="flex items-end gap-1.5 h-16">
              {daily_activity.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max((d.count / maxDaily) * 100, 10)}%` }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                    className="w-full rounded-md min-h-[4px]"
                    style={{ backgroundColor: ACCENT[i % ACCENT.length] + (i === daily_activity.length - 1 ? '' : '99') }}
                  />
                  <span className="text-[8px] text-gray-400 font-medium">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="col-span-2 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Notifications</p>
            <div className="space-y-2">
              {[
                { icon: CalendarOff, text: 'Time-off request', sub: 'Pending review', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                { icon: Clock, text: 'Shift swap request', sub: 'From J. Smith', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                { icon: Bell, text: 'Team update', sub: '2 new members', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              ].map((n, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.12 }}
                  className="flex items-center gap-2 py-1"
                >
                  <div className={`w-6 h-6 rounded-md ${n.bg} flex items-center justify-center flex-shrink-0`}>
                    <n.icon className={`w-3 h-3 ${n.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-gray-700 dark:text-gray-200 truncate">{n.text}</p>
                    <p className="text-[8px] text-gray-400 truncate">{n.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: Module bar */}
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50">
          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Module Usage</p>
          <div className="flex items-center gap-2">
            {module_usage.slice(0, 6).map((m, i) => {
              const maxVal = Math.max(...module_usage.map(x => x.value), 1);
              return (
                <div key={m.name} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(m.value / maxVal) * 100}%` }}
                      transition={{ delay: 0.6 + i * 0.08, duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: ACCENT[i % ACCENT.length] }}
                    />
                  </div>
                  <span className="text-[8px] text-gray-400 truncate max-w-full">{m.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const FeatureDashboardPage = () => {
  return (
    <FeaturePageLayout
      title="Dashboard"
      subtitle="Command Center for Your Team"
      description="Get a real-time bird's eye view of your entire operation. Monitor team activity, shift status, pending requests, and key metrics all in one place."
      heroComponent={<LiveDashboardWidget />}
      benefits={[
        { icon: LayoutDashboard, title: "Unified Overview", description: "See team members, meetings, shifts, and documents at a glance." },
        { icon: TrendingUp, title: "Real-Time Metrics", description: "Live counters and charts update automatically as your team works." },
        { icon: Bell, title: "Manager Notifications", description: "Instant alerts for time-off requests, swap requests, and team updates." },
      ]}
      features={[
        { title: "Activity Timeline", description: "Track weekly activity trends with visual charts and sparklines." },
        { title: "Shift Overview", description: "See today's shifts, hours tracked, and pending swap/time-off requests." },
        { title: "Module Usage", description: "Understand which platform features your team uses most." },
        { title: "Quick Actions", description: "Approve requests, assign shifts, and send broadcasts right from the dashboard." },
      ]}
      useCases={[
        { title: "Morning Standup", description: "Open the dashboard to review today's shifts and pending requests before the day starts." },
        { title: "Resource Planning", description: "Use module usage data to identify underutilized tools and plan training." },
        { title: "Executive Reporting", description: "Export dashboard data for weekly leadership updates." },
        { title: "Remote Team Management", description: "Monitor clock-in/out times and activity for distributed teams." },
      ]}
      prevFeature={{ name: "Analytics", link: "/features/analytics" }}
      nextFeature={{ name: "Shifts", link: "/features/shifts" }}
    />
  );
};

export default FeatureDashboardPage;
