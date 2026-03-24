import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getApiUrl } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  MessageSquare, CheckCircle2, LogIn, FileText, Activity, Clock,
  TrendingUp, Radio
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ── Shared helpers ──

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

// ── Custom hook for dashboard SSE stream ──

export const useDashboardStream = () => {
  const { user } = useAuth();
  const [graphData, setGraphData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!user?.id || eventSourceRef.current) return;
    const apiUrl = getApiUrl();
    const url = `${apiUrl}/api/dashboard/activity/stream?user_id=${user.id}`;

    try {
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener('init', (e) => {
        const data = JSON.parse(e.data);
        setGraphData(data.graph || []);
        setActivities(data.activities || []);
        if (data.stats) setStats(data.stats);
        setIsLive(true);
        setLastUpdated(new Date());
      });

      es.addEventListener('update', (e) => {
        const data = JSON.parse(e.data);
        setGraphData(data.graph || []);
        setActivities(data.activities || []);
        if (data.stats) setStats(data.stats);
        setLastUpdated(new Date());
      });

      es.addEventListener('ping', () => {
        // Connection alive
      });

      es.onerror = () => {
        setIsLive(false);
        es.close();
        eventSourceRef.current = null;
        // Reconnect after 5s
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };
    } catch (err) {
      console.error('Dashboard SSE error:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { graphData, activities, stats, isLive, lastUpdated };
};

// ── Animated number counter ──

const AnimatedNumber = ({ value, className }) => {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === value) return;
    prevRef.current = value;

    const diff = value - prev;
    const steps = 12;
    const stepTime = 400 / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(prev + diff * eased));
      if (step >= steps) {
        clearInterval(interval);
        setDisplay(value);
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [value]);

  return <span className={className}>{display}</span>;
};

// ── Live indicator dot ──

const LiveDot = ({ isLive }) => (
  <div className="flex items-center gap-1.5" data-testid="live-indicator">
    <span className={cn(
      "relative flex h-2 w-2",
      isLive ? "text-emerald-500" : "text-gray-400"
    )}>
      {isLive && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      )}
      <span className={cn(
        "relative inline-flex rounded-full h-2 w-2",
        isLive ? "bg-emerald-500" : "bg-gray-400"
      )} />
    </span>
    <span className={cn(
      "text-[10px] font-semibold uppercase tracking-wider",
      isLive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"
    )}>
      {isLive ? 'Live' : 'Offline'}
    </span>
  </div>
);

// ── Custom chart tooltip ──

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

// ── Activity Graph with live updates ──

export const ActivityGraph = ({ data, isLive, lastUpdated }) => {
  const totalActivity = (data || []).reduce((sum, d) => sum + d.total, 0);

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
        <div className="flex items-center gap-4">
          <LiveDot isLive={isLive} />
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              <AnimatedNumber value={totalActivity} />
            </p>
            <p className="text-[11px] text-gray-400">total events</p>
          </div>
        </div>
      </div>
      {!data || data.length === 0 ? (
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
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4 flex-wrap">
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
        {lastUpdated && (
          <p className="text-[10px] text-gray-400">
            Updated {formatTimestamp(lastUpdated.toISOString())}
          </p>
        )}
      </div>
    </div>
  );
};

// ── Recent Activity Feed with live updates ──

export const RecentActivityFeed = ({ activities, isLive }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-gray-800 h-full flex flex-col" data-testid="activity-feed">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
          <Activity className="w-5 h-5 text-emerald-500" />
          Recent Activity
        </h3>
        <div className="flex items-center gap-3">
          <LiveDot isLive={isLive} />
          <span className="text-[11px] text-gray-400">{(activities || []).length} items</span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {!activities || activities.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No recent activity
          </div>
        ) : (
          <div className="space-y-1 max-h-[340px] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {activities.map((activity, i) => {
                const IconComp = ICON_MAP[activity.icon] || Activity;
                const colorClass = COLOR_MAP[activity.type] || 'text-gray-500 bg-gray-50 dark:bg-gray-800';
                const key = `${activity.type}-${activity.timestamp}-${i}`;
                return (
                  <motion.div
                    key={key}
                    layout
                    initial={{ opacity: 0, x: -16, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 16, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30, delay: i * 0.03 }}
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
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
