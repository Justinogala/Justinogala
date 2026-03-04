import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Search, Filter, RefreshCw, Clock, User, Settings, 
  Shield, Mail, Database, AlertCircle, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Activity, Download, Globe, Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAuditLogs, getAuditLogsSummary, exportAuditLogs } from '@/services/adminSettingsService';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const ACTION_CONFIG = {
  settings_update: { icon: Settings, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Settings Updated' },
  settings_delete: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Settings Deleted' },
  settings_reset: { icon: RefreshCw, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Settings Reset' },
  smtp_test: { icon: Mail, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'SMTP Test' },
  user_login: { icon: User, color: 'text-green-500', bg: 'bg-green-500/10', label: 'User Login' },
  user_logout: { icon: User, color: 'text-gray-500', bg: 'bg-gray-500/10', label: 'User Logout' },
  // Workspace actions
  workspace_suspend: { icon: Shield, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Workspace Suspended' },
  workspace_unsuspend: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Workspace Unsuspended' },
  workspace_delete: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Workspace Deleted' },
  workspace_archive: { icon: Database, color: 'text-gray-500', bg: 'bg-gray-500/10', label: 'Workspace Archived' },
  workspace_transfer_ownership: { icon: User, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Ownership Transferred' },
  workspace_member_removed: { icon: User, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Member Removed' },
  // Chat moderation actions
  chat_flag: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Message Flagged' },
  chat_unflag: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Message Unflagged' },
  chat_delete: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Message Deleted' },
  chat_bulk_action: { icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Bulk Moderation' },
  // Shift actions
  shift_cancel: { icon: XCircle, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Shift Cancelled' },
  shift_delete: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Shift Deleted' },
  shift_reassign: { icon: User, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Shift Reassigned' },
  default: { icon: Activity, color: 'text-gray-500', bg: 'bg-gray-500/10', label: 'Activity' }
};

const CATEGORY_COLORS = {
  email: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  security: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  general: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  notifications: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  system: 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300',
  workspace: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  chat_moderation: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  shift_management: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  all: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
};

const AdminAuditLogsPage = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [actionFilter, setActionFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5); // seconds
  const [lastUpdated, setLastUpdated] = useState(null);
  const [newLogsCount, setNewLogsCount] = useState(0);

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getAuditLogs({
        action: actionFilter || undefined,
        category: categoryFilter || undefined,
        limit,
        offset: page * limit
      });
      
      // Check for new logs
      if (logs.length > 0 && data.logs?.length > 0) {
        const newLogs = data.logs.filter(
          newLog => !logs.find(oldLog => oldLog.timestamp === newLog.timestamp && oldLog.action === newLog.action)
        );
        if (newLogs.length > 0 && silent) {
          setNewLogsCount(prev => prev + newLogs.length);
          toast({
            title: "New Activity",
            description: `${newLogs.length} new audit log${newLogs.length > 1 ? 's' : ''} detected`,
          });
        }
      }
      
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [actionFilter, categoryFilter, limit, page, logs, toast]);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await getAuditLogsSummary();
      setSummary(data.summary || []);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, categoryFilter, limit, page]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchLogs(true); // silent refresh
      fetchSummary();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchLogs, fetchSummary]);

  const handleManualRefresh = () => {
    setNewLogsCount(0);
    fetchLogs();
    fetchSummary();
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      await exportAuditLogs(format, {
        action: actionFilter || undefined,
        category: categoryFilter || undefined,
        limit: 1000
      });
      toast({ 
        title: "Export Successful", 
        description: `Audit logs exported as ${format.toUpperCase()}` 
      });
    } catch (error) {
      toast({ 
        title: "Export Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setExporting(false);
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'Unknown';
    const date = new Date(ts);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionConfig = (action) => {
    return ACTION_CONFIG[action] || ACTION_CONFIG.default;
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action?.toLowerCase().includes(term) ||
      log.category?.toLowerCase().includes(term) ||
      log.admin_email?.toLowerCase().includes(term) ||
      JSON.stringify(log.details)?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Audit Logs
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Track all administrative actions and changes
            {lastUpdated && (
              <span className="ml-2 text-xs">
                (Last updated: {formatTimestamp(lastUpdated)})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Real-time indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700">
            <div className={cn(
              "w-2 h-2 rounded-full",
              autoRefresh ? "bg-green-500 animate-pulse" : "bg-gray-500"
            )} />
            <span className="text-xs text-gray-400">
              {autoRefresh ? 'Live' : 'Paused'}
            </span>
            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              {autoRefresh ? 'Pause' : 'Resume'}
            </button>
          </div>
          
          {/* Refresh interval selector */}
          {autoRefresh && (
            <Select 
              value={refreshInterval.toString()} 
              onValueChange={(v) => setRefreshInterval(parseInt(v))}
            >
              <SelectTrigger className="w-[100px] h-8 text-xs border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 sec</SelectItem>
                <SelectItem value="5">5 sec</SelectItem>
                <SelectItem value="10">10 sec</SelectItem>
                <SelectItem value="30">30 sec</SelectItem>
                <SelectItem value="60">1 min</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* New logs badge */}
          {newLogsCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleManualRefresh}
              className="border-green-600 text-green-500 hover:bg-green-900/20"
            >
              <Activity className="w-3 h-3 mr-1 animate-pulse" />
              {newLogsCount} new
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="border-gray-700"
                disabled={exporting}
              >
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <FileText className="w-4 h-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="outline" 
            onClick={handleManualRefresh}
            className="border-gray-700"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summary.slice(0, 4).map((item, i) => {
          const config = getActionConfig(item.action);
          const Icon = config.icon;
          return (
            <motion.div
              key={item.action}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-slate-900/50 border-white/10 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className={cn("p-2 rounded-lg", config.bg)}>
                      <Icon className={cn("w-4 h-4", config.color)} />
                    </div>
                    <span className="text-2xl font-bold text-white">{item.count}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2 truncate">{config.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-white/10 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-slate-800 border-gray-700"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={(v) => setActionFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[180px] bg-slate-800 border-gray-700">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="settings_update">Settings Update</SelectItem>
                <SelectItem value="settings_delete">Settings Delete</SelectItem>
                <SelectItem value="settings_reset">Settings Reset</SelectItem>
                <SelectItem value="smtp_test">SMTP Test</SelectItem>
                <SelectItem value="workspace_suspend">Workspace Suspend</SelectItem>
                <SelectItem value="workspace_delete">Workspace Delete</SelectItem>
                <SelectItem value="chat_flag">Message Flagged</SelectItem>
                <SelectItem value="chat_delete">Message Deleted</SelectItem>
                <SelectItem value="shift_cancel">Shift Cancelled</SelectItem>
                <SelectItem value="shift_delete">Shift Deleted</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[180px] bg-slate-800 border-gray-700">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="notifications">Notifications</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="workspace">Workspace</SelectItem>
                <SelectItem value="chat_moderation">Chat Moderation</SelectItem>
                <SelectItem value="shift_management">Shift Management</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="bg-slate-900/50 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-400" />
            Activity Log
          </CardTitle>
          <CardDescription>Showing {filteredLogs.length} of {total} entries</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-violet-500" />
                <span className="ml-3 text-gray-400">Loading logs...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-gray-400">No audit logs found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log, index) => {
                  const config = getActionConfig(log.action);
                  const Icon = config.icon;
                  const isSuccess = log.details?.success !== false;
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-4 rounded-xl bg-slate-800/50 border border-gray-700/50 hover:border-gray-600/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn("p-2.5 rounded-lg shrink-0", config.bg)}>
                          <Icon className={cn("w-5 h-5", config.color)} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-white">{config.label}</span>
                            {log.category && (
                              <Badge className={cn("text-xs", CATEGORY_COLORS[log.category] || CATEGORY_COLORS.system)}>
                                {log.category}
                              </Badge>
                            )}
                            {log.action === 'smtp_test' && (
                              <Badge className={isSuccess ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                                {isSuccess ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                {isSuccess ? 'Success' : 'Failed'}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {log.admin_email || 'System'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(log.timestamp)}
                            </span>
                            {log.ip_address && (
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {log.ip_address}
                              </span>
                            )}
                          </div>
                          
                          {/* User Agent Row */}
                          {log.user_agent && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                              <Monitor className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-md" title={log.user_agent}>
                                {log.user_agent.length > 80 ? log.user_agent.substring(0, 80) + '...' : log.user_agent}
                              </span>
                            </div>
                          )}
                          
                          {log.details && Object.keys(log.details).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300">
                                View details
                              </summary>
                              <pre className="mt-2 p-2 bg-slate-900/50 rounded text-xs text-gray-400 overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="border-gray-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="border-gray-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditLogsPage;
