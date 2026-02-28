import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Activity, Video, Shield, AlertTriangle, 
  Clock, Calendar, RefreshCw, TrendingUp, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

const AdminMonitoringDashboard = () => {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [dashboardRes, healthRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/monitoring/dashboard`),
        fetch(`${API_URL}/api/admin/monitoring/system-health`)
      ]);

      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json();
        setData(dashboardData);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setSystemHealth(healthData);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      toast({ variant: 'destructive', title: 'Failed to load monitoring data' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" data-testid="admin-monitoring-dashboard">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Real-Time Monitoring</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Live system status and user activity
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-slate-500">
              Last updated: {format(lastUpdated, 'HH:mm:ss')}
            </span>
          )}
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Status */}
      <Card className={systemHealth?.status === 'healthy' ? 'border-green-500/50' : 'border-red-500/50'}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              System Health
            </CardTitle>
            <Badge variant={systemHealth?.status === 'healthy' ? 'default' : 'destructive'}>
              {systemHealth?.status || 'Unknown'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {systemHealth?.database?.connected ? 'Connected' : 'Disconnected'}
              </div>
              <div className="text-xs text-slate-500">Database</div>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-violet-600">
                {systemHealth?.database?.collections || 0}
              </div>
              <div className="text-xs text-slate-500">Collections</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Online Users</p>
                <p className="text-3xl font-bold text-green-600">{data?.real_time?.online_users || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Meetings</p>
                <p className="text-3xl font-bold text-violet-600">{data?.real_time?.active_meetings || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Video className="w-6 h-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Logins Today</p>
                <p className="text-3xl font-bold text-blue-600">{data?.today?.logins || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Failed Logins</p>
                <p className="text-3xl font-bold text-red-600">{data?.today?.failed_logins || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-slate-600 dark:text-slate-300">Total Users</span>
                <span className="text-xl font-bold">{data?.users?.total || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-green-700 dark:text-green-300">Active</span>
                <span className="text-xl font-bold text-green-600">{data?.users?.active || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <span className="text-red-700 dark:text-red-300">Disabled</span>
                <span className="text-xl font-bold text-red-600">{data?.users?.disabled || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-slate-600 dark:text-slate-300">Meetings Created</span>
                <span className="text-xl font-bold">{data?.today?.meetings || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-blue-700 dark:text-blue-300">User Logins</span>
                <span className="text-xl font-bold text-blue-600">{data?.today?.logins || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <span className="text-orange-700 dark:text-orange-300">Failed Attempts</span>
                <span className="text-xl font-bold text-orange-600">{data?.today?.failed_logins || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Recent Audit Logs
          </CardTitle>
          <CardDescription>Latest system activities</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {data?.recent_audit_logs?.map((log, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{log.action}</Badge>
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {log.admin_email || 'System'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {log.timestamp ? format(new Date(log.timestamp), 'MMM d, HH:mm') : ''}
                  </span>
                </div>
              ))}
              {(!data?.recent_audit_logs || data.recent_audit_logs.length === 0) && (
                <div className="text-center py-8 text-slate-500">
                  No recent audit logs
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMonitoringDashboard;
