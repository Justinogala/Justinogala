import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Users, HardDrive, Plus, FileText, Shield, Zap, Lock,
  ArrowUpRight, Sparkles, Calendar, Video, Mic,
  MessageSquare, ChevronRight, Crown, PenTool, BarChart3,
  Briefcase, ArrowRight, Bell, CheckCircle2, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { getApiUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

import NewMeetingModal from '@/components/user/NewMeetingModal';
import RecentFilesSection from '@/components/user/RecentFilesSection';
import MeetingListSection from '@/components/user/MeetingListSection';
import APIStatus from '@/components/APIStatus';
import UserPaymentDashboardWidget from '@/components/user/UserPaymentDashboardWidget';
import TranscriptionWidget from '@/components/TranscriptionWidget';
import UsageDashboard from '@/components/UsageDashboard';
import WorkspaceDashboardWidget from '@/components/user/WorkspaceDashboardWidget';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [refreshFilesTrigger, setRefreshFilesTrigger] = useState(0);
  const [refreshMeetingsTrigger, setRefreshMeetingsTrigger] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState({
    workspaceCount: 0,
    memberCount: 0,
    pendingApprovals: 0,
    announcements: 0,
    workspaces: [],
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;
    const apiUrl = getApiUrl();
    const token = localStorage.getItem('munal_token');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const res = await fetch(`${apiUrl}/api/workspaces/dashboard/summary?user_id=${user.id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const workspaces = data.workspaces || [];
        const totalMembers = workspaces.reduce((sum, ws) => sum + (ws.member_count || 0), 0);
        setDashboardData({
          workspaceCount: workspaces.length,
          memberCount: totalMembers,
          pendingApprovals: data.total_pending_approvals || 0,
          announcements: data.total_announcements || 0,
          workspaces: workspaces.slice(0, 4),
        });
      }
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    }
  }, [user?.id]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const handleMeetingSuccess = () => {
    setRefreshMeetingsTrigger(prev => prev + 1);
  };

  const isAdmin = user && ['admin', 'super_admin', 'manager'].includes((user.role || '').toLowerCase());

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getPlanInfo = () => {
    const plan = user?.plan || 'Free';
    if (plan === 'Enterprise') return { icon: Crown, color: 'from-amber-400 to-orange-500', label: 'Enterprise' };
    if (plan === 'Pro') return { icon: Sparkles, color: 'from-violet-400 to-purple-500', label: 'Pro' };
    return null;
  };

  const planInfo = getPlanInfo();

  const stats = [
    { label: 'Workspaces', value: dashboardData.workspaceCount, icon: Briefcase, gradient: 'from-indigo-500 to-violet-600', shadow: 'shadow-indigo-500/20', path: '/workspaces' },
    { label: 'Team Members', value: dashboardData.memberCount, icon: Users, gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
    { label: 'Approvals', value: dashboardData.pendingApprovals, icon: CheckCircle2, gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20', highlight: dashboardData.pendingApprovals > 0 },
    { label: 'Announcements', value: dashboardData.announcements, icon: Bell, gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/20' },
  ];

  const quickActions = [
    { label: 'New Meeting', icon: Video, gradient: 'from-violet-500 to-indigo-600', action: () => navigate('/meetings'), desc: 'Start or schedule' },
    { label: 'Record', icon: Mic, gradient: 'from-rose-500 to-pink-500', action: () => navigate('/quick-record'), desc: 'Screen or camera', badge: 'NEW' },
    { label: 'Transcribe', icon: FileText, gradient: 'from-blue-500 to-cyan-500', action: () => navigate('/transcriptions'), desc: 'Audio to text' },
    { label: 'Chat', icon: MessageSquare, gradient: 'from-emerald-500 to-teal-500', action: () => navigate('/workspace/chat'), desc: 'Team messages' },
    { label: 'Workspaces', icon: Briefcase, gradient: 'from-amber-500 to-orange-500', action: () => navigate('/workspaces'), desc: 'Your teams' },
    { label: 'eSignature', icon: PenTool, gradient: 'from-indigo-500 to-blue-600', action: () => navigate('/e-signature'), desc: 'Sign documents', badge: 'NEW' },
    { label: 'AI Assistant', icon: Sparkles, gradient: 'from-fuchsia-500 to-pink-600', action: () => navigate('/ai-chat'), desc: 'Ask anything' },
    { label: 'Reports', icon: BarChart3, gradient: 'from-slate-600 to-gray-700', action: () => navigate('/reports'), desc: 'IR / SOR' },
  ];

  const wsGradients = ['from-indigo-500 to-violet-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600'];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" data-testid="user-dashboard">
      <Helmet><title>Dashboard | Munal AI</title></Helmet>

      <motion.div className="max-w-[1400px] mx-auto space-y-7" variants={container} initial="hidden" animate="show">

        {/* Hero Header */}
        <motion.div variants={item} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-6 sm:px-10 py-8 sm:py-10 text-white" data-testid="dashboard-hero">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(99,102,241,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.1),transparent_50%)]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-medium text-white/70">
                  <Calendar className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                  {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
                {planInfo && (
                  <span className={cn("px-3 py-1.5 rounded-full bg-gradient-to-r text-white text-xs font-bold flex items-center gap-1.5", planInfo.color)}>
                    <planInfo.icon className="w-3.5 h-3.5" />
                    {planInfo.label}
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">{user?.name?.split(' ')[0] || 'there'}</span>
              </h1>
              <p className="text-white/50 mt-2 max-w-lg text-sm sm:text-base">
                {dashboardData.workspaceCount > 0
                  ? `You're part of ${dashboardData.workspaceCount} workspace${dashboardData.workspaceCount > 1 ? 's' : ''} with ${dashboardData.memberCount} team member${dashboardData.memberCount > 1 ? 's' : ''}.`
                  : "Your AI meeting companion is ready. Let's get started."}
                {dashboardData.pendingApprovals > 0 && (
                  <span className="text-amber-400 font-medium"> {dashboardData.pendingApprovals} pending approval{dashboardData.pendingApprovals > 1 ? 's' : ''}.</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {isAdmin && (
                <Button onClick={() => navigate('/workspaces')} className="bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-sm h-10 gap-2 rounded-xl" data-testid="dashboard-create-workspace-btn">
                  <Plus className="w-4 h-4" /> New Workspace
                </Button>
              )}
              <Button onClick={() => navigate('/meetings')} className="bg-white text-slate-900 hover:bg-white/90 h-10 gap-2 font-semibold shadow-lg shadow-black/20 rounded-xl" data-testid="dashboard-new-meeting-btn">
                <Video className="w-4 h-4" /> New Meeting
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" data-testid="dashboard-stats">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              className="group relative cursor-pointer"
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              onClick={() => stat.path && navigate(stat.path)}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-r rounded-2xl blur-xl opacity-0 group-hover:opacity-15 transition-opacity", stat.gradient)} />
              <div className={cn(
                "relative bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border transition-all duration-300 shadow-sm hover:shadow-md",
                stat.highlight ? "border-amber-200 dark:border-amber-800/50" : "border-gray-100 dark:border-gray-800/50"
              )}>
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("p-2.5 rounded-xl bg-gradient-to-br shadow-lg", stat.gradient, stat.shadow)}>
                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  {stat.highlight && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                      Pending
                    </span>
                  )}
                  {stat.path && <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item} data-testid="dashboard-quick-actions">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <motion.button
                key={action.label}
                onClick={action.action}
                className="group relative flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm hover:shadow-lg transition-all text-center"
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.97 }}
                data-testid={`quick-action-${action.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                {action.badge && (
                  <Badge className="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] px-1.5 py-0 border-0">{action.badge}</Badge>
                )}
                <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300", action.gradient)}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{action.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{action.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Workspace Cards */}
        {dashboardData.workspaces.length > 0 && (
          <motion.div variants={item} data-testid="dashboard-workspaces">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-500" />
                Your Workspaces
              </h2>
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-gray-500 hover:text-gray-700" onClick={() => navigate('/workspaces')} data-testid="view-all-workspaces-btn">
                View All <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {dashboardData.workspaces.map((ws, i) => (
                <motion.div
                  key={ws.id}
                  className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                  whileHover={{ y: -3 }}
                  onClick={() => navigate(`/workspace/${ws.id}`)}
                  data-testid={`workspace-card-${ws.id}`}
                >
                  <div className={cn("h-1.5 bg-gradient-to-r", wsGradients[i % wsGradients.length])} />
                  <div className="p-4 flex items-start gap-3">
                    <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shadow flex-shrink-0", wsGradients[i % wsGradients.length])}>
                      {ws.icon || ws.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {ws.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {ws.member_count || 0}
                        </span>
                        {ws.pending_approvals > 0 && (
                          <span className="text-[11px] text-amber-500 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {ws.pending_approvals}
                          </span>
                        )}
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                          {ws.scope === 'org' ? 'Org' : 'Team'}
                        </Badge>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-1" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Usage & Limits */}
        <motion.div variants={item}>
          <UsageDashboard />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <motion.div variants={item} className="lg:col-span-8 space-y-6">
            <MeetingListSection refreshTrigger={refreshMeetingsTrigger} />
            <RecentFilesSection refreshTrigger={refreshFilesTrigger} />
          </motion.div>

          <motion.div variants={item} className="lg:col-span-4 space-y-6">
            <TranscriptionWidget />
            <UserPaymentDashboardWidget />

            {/* Security Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800" data-testid="security-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  Security
                </h3>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase">
                  Secure
                </span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 group hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => navigate('/profile')} data-testid="security-password-link">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                      <Lock className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Password</p>
                      <p className="text-[11px] text-gray-400">Changed 30d ago</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 group hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => navigate('/profile')} data-testid="security-2fa-link">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                      <Shield className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">2FA Auth</p>
                      <p className="text-[11px] text-amber-600">Not enabled</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-violet-600 dark:text-violet-400">Enable</span>
                </div>
              </div>
            </div>

            <APIStatus />
          </motion.div>
        </div>
      </motion.div>

      <NewMeetingModal
        isOpen={showNewMeetingModal}
        onClose={() => setShowNewMeetingModal(false)}
        onSuccess={handleMeetingSuccess}
      />
    </div>
  );
};

export default UserDashboard;
