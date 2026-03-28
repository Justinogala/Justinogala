import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CalendarOff, ArrowLeftRight, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getApiUrl } from '@/lib/api';

const API = getApiUrl();

const ICON_MAP = {
  time_off_request: CalendarOff,
  swap_request: ArrowLeftRight,
};

const COLOR_MAP = {
  time_off_request: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
  swap_request: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
};

const ManagerNotificationBell = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API}/api/shifts/manager-notifications/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnread(data.unread_count || 0);
      }
    } catch { /* silent */ }
  }, [userId]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Poll every 30s
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id) => {
    try {
      await fetch(`${API}/api/shifts/manager-notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API}/api/shifts/manager-notifications-read-all/${userId}`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch { /* silent */ }
  };

  const timeAgo = useCallback((iso) => {
    const now = Date.now();
    const diff = (now - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className={cn('relative', open && 'bg-gray-100 dark:bg-slate-800')}
        onClick={() => setOpen(!open)}
        data-testid="manager-notification-bell"
      >
        <Bell className={cn('w-5 h-5', unread > 0 && 'text-indigo-600')} />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white dark:border-slate-900 text-[7px] text-white font-bold items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 z-50 overflow-hidden" data-testid="manager-notification-panel">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</span>
              {unread > 0 && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{unread}</Badge>}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium" data-testid="mark-all-read-btn">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No notifications yet</div>
            ) : (
              notifications.map((n) => {
                const Icon = ICON_MAP[n.type] || Bell;
                const color = COLOR_MAP[n.type] || 'bg-gray-50 text-gray-500';
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'px-4 py-3 border-b border-gray-50 dark:border-slate-800/50 flex gap-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50',
                      !n.read && 'bg-indigo-50/40 dark:bg-indigo-950/10'
                    )}
                    onClick={() => !n.read && markRead(n.id)}
                    data-testid={`notification-item-${n.id}`}
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-xs', n.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white font-medium')}>{n.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-300 dark:text-gray-500 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerNotificationBell;
