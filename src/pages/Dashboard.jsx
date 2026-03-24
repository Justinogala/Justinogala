import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Clock, FileText, Users, Plus, ArrowUpRight, Calendar,
  Video, MessageSquare, Briefcase, ChevronRight, Sparkles,
  Mic, PenTool, BarChart3, Zap, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UsageDashboard from '@/components/UsageDashboard';
import { getApiUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

const GREETING = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const QUICK_ACTIONS = [
  { label: 'New Meeting', desc: 'Start or schedule', icon: Video, path: '/meetings', color: 'from-blue-500 to-cyan-500', ring: 'ring-blue-200 dark:ring-blue-800' },
  { label: 'Record', desc: 'Screen or camera', icon: Mic, path: '/quick-record', color: 'from-rose-500 to-pink-500', ring: 'ring-rose-200 dark:ring-rose-800', badge: 'NEW' },
  { label: 'Transcribe', desc: 'Audio to text', icon: FileText, path: '/transcriptions', color: 'from-violet-500 to-purple-500', ring: 'ring-violet-200 dark:ring-violet-800' },
  { label: 'Chat', desc: 'Team messages', icon: MessageSquare, path: '/workspace/chat', color: 'from-emerald-500 to-teal-500', ring: 'ring-emerald-200 dark:ring-emerald-800' },
  { label: 'Workspaces', desc: 'Your teams', icon: Briefcase, path: '/workspaces', color: 'from-amber-500 to-orange-500', ring: 'ring-amber-200 dark:ring-amber-800' },
  { label: 'eSignature', desc: 'Sign documents', icon: PenTool, path: '/e-signature', color: 'from-indigo-500 to-blue-600', ring: 'ring-indigo-200 dark:ring-indigo-800', badge: 'NEW' },
  { label: 'AI Assistant', desc: 'Ask anything', icon: Sparkles, path: '/ai-chat', color: 'from-fuchsia-500 to-pink-600', ring: 'ring-fuchsia-200 dark:ring-fuchsia-800' },
  { label: 'Reports', desc: 'IR / SOR', icon: BarChart3, path: '/reports', color: 'from-slate-600 to-gray-700', ring: 'ring-gray-200 dark:ring-gray-700' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [stats, setStats] = useState({ users: 0, workspaces: 0, messages: 0 });
  const isAdmin = user && ['admin', 'super_admin', 'manager'].includes((user.role || '').toLowerCase());

  const fetchData = useCallback(async () => {
    const apiUrl = getApiUrl();
    const token = localStorage.getItem('munal_token');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [wsRes, usersRes] = await Promise.all([
        fetch(`${apiUrl}/api/workspaces?user_id=${user?.id}`, { headers }).then(r => r.ok ? r.json() : { workspaces: [] }),
        fetch(`${apiUrl}/api/users`, { headers }).then(r => r.ok ? r.json() : { users: [] }),
      ]);
      setWorkspaces((wsRes.workspaces || []).slice(0, 4));
      setStats({
        users: (usersRes.users || usersRes || []).length || 0,
        workspaces: (wsRes.workspaces || []).length,
        messages: 0,
      });
    } catch (e) { console.error('Dashboard fetch error:', e); }
  }, [user]);

  useEffect(() => { if (user?.id) fetchData(); }, [user, fetchData]);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-8 pb-12 max-w-[1400px] mx-auto">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-6 sm:px-10 py-8 sm:py-10 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5 blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <p className="text-white/60 text-sm flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" /> {dateStr}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {GREETING()}, <span className="text-amber-300">{user?.name?.split(' ')[0] || 'there'}</span>
            </h1>
            <p className="text-white/70 mt-2 max-w-md text-sm sm:text-base">
              {stats.workspaces > 0
                ? `You have ${stats.workspaces} workspace${stats.workspaces > 1 ? 's' : ''} and ${stats.users} team member${stats.users > 1 ? 's' : ''} ready to go.`
                : "Your AI meeting companion is ready. Let's get started."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button onClick={() => navigate('/workspaces')} className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm h-10 gap-2" data-testid="dashboard-create-workspace-btn">
                <Plus className="w-4 h-4" /> New Workspace
              </Button>
            )}
            <Button onClick={() => navigate('/meetings')} className="bg-white text-indigo-700 hover:bg-white/90 h-10 gap-2 font-semibold shadow-lg shadow-indigo-900/30">
              <Video className="w-4 h-4" /> New Meeting
            </Button>
          </div>
        </div>
      </div>

      {/* ── Live Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Workspaces', value: stats.workspaces, icon: Briefcase, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/50' },
          { label: 'Team Members', value: stats.users, icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50' },
          { label: 'Quick Record', value: 'Start', icon: Mic, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/50', path: '/quick-record' },
          { label: 'Calendar', value: 'Open', icon: Calendar, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50', path: '/calendar' },
        ].map((s) => (
          <Card
            key={s.label}
            className={cn(
              "group cursor-pointer border-0 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5",
              s.bg
            )}
            onClick={() => s.path && navigate(s.path)}
            data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, '-')}`}
          >
            <CardContent className="p-4 sm:p-5 flex items-center gap-4">
              <div className={cn("p-2.5 rounded-xl bg-white/80 dark:bg-white/10 shadow-sm", s.color)}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
              </div>
              {s.path && <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Quick Actions Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quick Actions</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="group relative flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 text-center"
              data-testid={`quick-action-${action.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              {action.badge && (
                <Badge className="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] px-1.5 py-0 border-0">{action.badge}</Badge>
              )}
              <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 group-hover:scale-110 transition-transform", action.color, action.ring)}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{action.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Workspaces + Usage side-by-side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Workspaces Preview */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-500" /> Your Workspaces
            </h2>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-gray-500" onClick={() => navigate('/workspaces')}>
              View All <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
          {workspaces.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Briefcase className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No workspaces yet</p>
                {isAdmin && (
                  <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => navigate('/workspaces')}>
                    <Plus className="w-3 h-3" /> Create One
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {workspaces.map((ws, i) => {
                const gradients = [
                  'from-indigo-500 to-violet-600',
                  'from-emerald-500 to-teal-600',
                  'from-amber-500 to-orange-600',
                  'from-rose-500 to-pink-600',
                ];
                return (
                  <Card
                    key={ws.id}
                    className="group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 overflow-hidden"
                    onClick={() => navigate(`/workspace/${ws.id}`)}
                    data-testid={`workspace-card-${ws.id}`}
                  >
                    <CardContent className="p-0">
                      <div className={cn("h-2 bg-gradient-to-r", gradients[i % gradients.length])} />
                      <div className="p-4 flex items-start gap-3">
                        <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shadow flex-shrink-0", gradients[i % gradients.length])}>
                          {ws.icon || ws.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {ws.name}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{ws.description || 'No description'}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                              {ws.scope === 'org' ? 'Organisation' : 'Team'}
                            </Badge>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Usage & Limits */}
        <div className="lg:col-span-2">
          <UsageDashboard compact />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
