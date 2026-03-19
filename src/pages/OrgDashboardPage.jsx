import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Users, Shield, Briefcase, FileCheck, Clock,
  CheckCircle2, XCircle, Bell, Globe, Lock, Loader2,
  ArrowUpRight, ChevronRight, UserPlus, BarChart3, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const OrgDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.organization_id || !user?.id) return;
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${API_URL}/api/organizations/${user.organization_id}/dashboard?user_id=${user.id}`);
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error('Failed to load org dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user?.organization_id, user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="org-dashboard-loading">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center" data-testid="org-dashboard-empty">
        <Building2 className="w-12 h-12 text-slate-300 mb-3" />
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No Organization Found</h2>
        <p className="text-sm text-slate-500 mt-1">You need to be part of an organization to view this dashboard.</p>
      </div>
    );
  }

  const { organization: org, stats, role_distribution, members, workspaces, activity } = data;

  const statCards = [
    { label: 'Total Members', value: stats.total_members, icon: Users, color: 'from-violet-500 to-indigo-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
    { label: 'Active Members', value: stats.active_members, icon: Shield, color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Workspaces', value: stats.workspace_count, icon: Building2, color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Pending Approvals', value: stats.pending_approvals, icon: Clock, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Completed', value: stats.completed_approvals, icon: CheckCircle2, color: 'from-teal-500 to-emerald-600', bg: 'bg-teal-50 dark:bg-teal-950/30' },
    { label: 'Total Approvals', value: stats.total_approvals, icon: BarChart3, color: 'from-slate-500 to-gray-600', bg: 'bg-slate-50 dark:bg-slate-800/50' },
  ];

  return (
    <motion.div
      className="space-y-6 max-w-7xl mx-auto"
      variants={container}
      initial="hidden"
      animate="show"
      data-testid="org-dashboard-page"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-violet-500/25">
            {org.name?.charAt(0) || 'O'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="org-dashboard-name">
              {org.name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              {org.domain && (
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> {org.domain}
                </span>
              )}
              <Badge variant="secondary" className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                <Briefcase className="w-3 h-3 mr-0.5" /> Organization
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s, i) => (
          <div
            key={s.label}
            className={`${s.bg} rounded-xl p-4 border border-transparent`}
            data-testid={`org-stat-${s.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{s.value}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Members + Workspaces */}
        <div className="lg:col-span-2 space-y-6">
          {/* Members Table */}
          <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-500" /> Team Members
                <span className="text-xs text-slate-400 font-normal">({stats.total_members})</span>
              </h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {members.slice(0, 8).map((m, i) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" data-testid={`org-dash-member-${i}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-medium">
                      {m.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{m.name}</p>
                      <p className="text-[11px] text-slate-400">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] px-1.5">
                      {m.org_role || 'member'}
                    </Badge>
                    <span className={`w-2 h-2 rounded-full ${m.status === 'Active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  </div>
                </div>
              ))}
            </div>
            {members.length > 8 && (
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-400">+ {members.length - 8} more members</span>
              </div>
            )}
          </motion.div>

          {/* Workspaces */}
          <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" /> Organization Workspaces
                <span className="text-xs text-slate-400 font-normal">({workspaces.length})</span>
              </h2>
              <Button size="sm" variant="ghost" className="text-xs text-violet-600" onClick={() => navigate('/workspaces')} data-testid="org-dash-view-workspaces">
                View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </div>
            {workspaces.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No workspaces yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {workspaces.map((ws, i) => (
                  <button
                    key={ws.id}
                    onClick={() => navigate(`/workspaces/${ws.id}`)}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
                    data-testid={`org-dash-workspace-${i}`}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: ws.color || '#6366f1' }}
                    >
                      {ws.icon || ws.name?.charAt(0)?.toUpperCase() || 'W'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{ws.name}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        {ws.scope === 'org' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {ws.scope === 'org' ? 'Organization-wide' : 'Team'}
                      </p>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right: Activity Feed + Role Distribution */}
        <div className="space-y-6">
          {/* Role Distribution */}
          <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-emerald-500" /> Role Breakdown
            </h3>
            <div className="space-y-3">
              {Object.entries(role_distribution).map(([role, count]) => {
                const pct = stats.total_members > 0 ? Math.round((count / stats.total_members) * 100) : 0;
                const colors = { admin: 'bg-violet-500', manager: 'bg-blue-500', member: 'bg-slate-400' };
                return (
                  <div key={role} data-testid={`org-dash-role-${role}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{role}</span>
                      <span className="text-xs text-slate-400">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[role] || 'bg-slate-400'} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Approval Breakdown */}
          <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <FileCheck className="w-4 h-4 text-amber-500" /> Approval Overview
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Pending', value: stats.pending_approvals, icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
                { label: 'Approved', value: stats.completed_approvals, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
                { label: 'Rejected', value: stats.rejected_approvals, icon: XCircle, color: 'text-red-600 bg-red-50 dark:bg-red-900/30' },
              ].map(s => (
                <div key={s.label} className={`flex items-center justify-between p-3 rounded-lg ${s.color}`} data-testid={`org-dash-approval-${s.label.toLowerCase()}`}>
                  <div className="flex items-center gap-2">
                    <s.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{s.label}</span>
                  </div>
                  <span className="text-lg font-bold">{s.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Activity Feed */}
          <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" /> Recent Activity
              </h3>
            </div>
            {activity.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No recent activity</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
                {activity.slice(0, 10).map((a, i) => (
                  <div key={i} className="px-5 py-3" data-testid={`org-dash-activity-${i}`}>
                    <div className="flex items-start gap-2.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        a.type === 'announcement' ? 'bg-blue-100 dark:bg-blue-900/40' : 
                        a.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/40' :
                        a.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/40' :
                        'bg-amber-100 dark:bg-amber-900/40'
                      }`}>
                        {a.type === 'announcement' ? <Bell className="w-3 h-3 text-blue-600" /> :
                         a.status === 'approved' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> :
                         a.status === 'rejected' ? <XCircle className="w-3 h-3 text-red-600" /> :
                         <Clock className="w-3 h-3 text-amber-600" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{a.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {a.type === 'approval' && a.sender && `by ${a.sender} · `}
                          {a.type === 'announcement' ? 'Announcement' : a.status}
                          {a.pinned && ' · Pinned'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrgDashboardPage;
