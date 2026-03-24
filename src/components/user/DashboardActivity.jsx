import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getApiUrl } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  MessageSquare, CheckCircle2, LogIn, FileText, Activity, Clock,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const ICON_MAP = {
  message: MessageSquare,
  approval: CheckCircle2,
  login: LogIn,
  document: FileText,
};

const COLOR_MAP = {
  message: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40',
  approval: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40',
  login: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
  esignature: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40',
  document: 'text-violet-500 bg-violet-50 dark:bg-violet-950/40',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-xl text-sm">
      <p className="font-semibold text-gray-900 dark:text-white mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="capitalize">{p.dataKey}:</span>
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const formatTimestamp = (ts) => {
  if (!ts) return '';
  try {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

export const ActivityGraph = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetchActivity = async () => {
      try {
        const apiUrl = getApiUrl();
        const token = localStorage.getItem('munal_token');
        const res = await fetch(`${apiUrl}/api/dashboard/activity?user_id=${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const result = await res.json();
          setData(result.graph || []);
        }
      } catch (e) {
        console.error('Activity graph fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [user?.id]);

  const totalActivity = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-gray-800" data-testid="activity-graph">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            Weekly Activity
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Last 7 days overview</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalActivity}</p>
          <p className="text-[11px] text-gray-400">total events</p>
        </div>
      </div>
      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse text-sm text-gray-400">Loading chart...</div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barGap={2} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)', radius: 8 }} />
            <Bar dataKey="messages" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Messages" />
            <Bar dataKey="approvals" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Approvals" />
            <Bar dataKey="meetings" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Meetings" />
            <Bar dataKey="logins" fill="#10b981" radius={[4, 4, 0, 0]} name="Logins" />
          </BarChart>
        </ResponsiveContainer>
      )}
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {[
          { key: 'messages', color: '#3b82f6', label: 'Messages' },
          { key: 'approvals', color: '#f59e0b', label: 'Approvals' },
          { key: 'meetings', color: '#8b5cf6', label: 'Meetings' },
          { key: 'logins', color: '#10b981', label: 'Logins' },
        ].map((item) => (
          <div key={item.key} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export const RecentActivityFeed = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetchActivity = async () => {
      try {
        const apiUrl = getApiUrl();
        const token = localStorage.getItem('munal_token');
        const res = await fetch(`${apiUrl}/api/dashboard/activity?user_id=${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const result = await res.json();
          setActivities(result.activities || []);
        }
      } catch (e) {
        console.error('Activity feed fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [user?.id]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-gray-800" data-testid="activity-feed">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
          <Activity className="w-5 h-5 text-emerald-500" />
          Recent Activity
        </h3>
        <span className="text-[11px] text-gray-400">{activities.length} items</span>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex gap-3 p-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No recent activity
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((activity, i) => {
            const IconComp = ICON_MAP[activity.icon] || Activity;
            const colorClass = COLOR_MAP[activity.type] || 'text-gray-500 bg-gray-50 dark:bg-gray-800';
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className={cn("p-2 rounded-xl flex-shrink-0", colorClass)}>
                  <IconComp className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{activity.title}</p>
                  {activity.description && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{activity.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-400 flex-shrink-0 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {formatTimestamp(activity.timestamp)}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
