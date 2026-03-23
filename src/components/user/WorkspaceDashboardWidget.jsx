import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Building2, Users, Bell, FileCheck, ChevronRight,
  Globe, Lock, Loader2, LayoutGrid, ArrowUpRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { API_URL } from '@/lib/api';

const WorkspaceDashboardWidget = () => {
  const { user } = useAuth();
  const isAdmin = user && ['admin', 'super_admin', 'manager'].includes((user.role || '').toLowerCase());
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetchSummary = async () => {
      try {
        const res = await fetch(`${API_URL}/api/workspaces/dashboard/summary?user_id=${user.id}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch workspace summary', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [user?.id]);

  if (loading) {
    return (
      <div data-testid="workspace-widget-loading" className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/50 dark:border-gray-800/50">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
        </div>
      </div>
    );
  }

  const workspaces = data?.workspaces || [];
  const totalPending = data?.total_pending_approvals || 0;

  return (
    <div data-testid="workspace-dashboard-widget" className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/50 dark:border-gray-800/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-violet-500" />
          Workspaces
        </h3>
        {totalPending > 0 && (
          <span data-testid="workspace-widget-total-pending" className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase">
            {totalPending} Pending
          </span>
        )}
        {totalPending === 0 && workspaces.length > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase">
            All Clear
          </span>
        )}
      </div>

      {/* Workspace List */}
      {workspaces.length === 0 ? (
        <div data-testid="workspace-widget-empty" className="text-center py-6">
          <Building2 className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {isAdmin ? 'No workspaces yet' : 'No workspaces assigned to you yet'}
          </p>
          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => navigate('/workspaces')}
              data-testid="workspace-widget-create-btn"
            >
              Create Workspace
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {workspaces.slice(0, 4).map((ws, i) => (
            <motion.button
              key={ws.id}
              data-testid={`workspace-widget-item-${i}`}
              onClick={() => navigate(`/workspace/${ws.id}`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200 text-left group"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {/* Color Icon */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
                style={{ backgroundColor: ws.color || '#6366f1' }}
              >
                {ws.icon || ws.name?.charAt(0)?.toUpperCase() || 'W'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                    {ws.name}
                  </span>
                  {ws.scope === 'org' ? (
                    <Globe className="w-3 h-3 text-blue-400 shrink-0" />
                  ) : (
                    <Lock className="w-3 h-3 text-gray-400 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {ws.member_count}
                  </span>
                  {ws.announcement_count > 0 && (
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <Bell className="w-3 h-3" />
                      {ws.announcement_count}
                    </span>
                  )}
                </div>
              </div>

              {/* Pending Badge */}
              <div className="flex items-center gap-2 shrink-0">
                {ws.pending_approvals > 0 && (
                  <Badge
                    data-testid={`workspace-widget-pending-${i}`}
                    variant="secondary"
                    className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-[10px] px-1.5 py-0.5"
                  >
                    <FileCheck className="w-3 h-3 mr-0.5" />
                    {ws.pending_approvals}
                  </Badge>
                )}
                {ws.recent_announcements > 0 && ws.pending_approvals === 0 && (
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                )}
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.button>
          ))}

          {/* View All */}
          {workspaces.length > 4 && (
            <button
              data-testid="workspace-widget-view-all"
              onClick={() => navigate('/workspaces')}
              className="w-full flex items-center justify-center gap-1 py-2 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 transition-colors"
            >
              View all {workspaces.length} workspaces
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {workspaces.length <= 4 && (
            <button
              data-testid="workspace-widget-manage"
              onClick={() => navigate('/workspaces')}
              className="w-full flex items-center justify-center gap-1 py-2 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Manage Workspaces
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceDashboardWidget;
