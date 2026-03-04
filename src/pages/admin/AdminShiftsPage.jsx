import React, { useState, useEffect } from 'react';
import { 
  Clock, Users, Calendar, Search, RefreshCw, 
  MoreHorizontal, Eye, Trash2, AlertTriangle, CheckCircle,
  Building2, ChevronLeft, ChevronRight, Filter, Download,
  TrendingUp, BarChart2, UserX, FileText, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import PageTransition from '@/components/PageTransition';
import { format } from 'date-fns';

const API_URL = import.meta.env.REACT_APP_BACKEND_URL || '';

const AdminShiftsPage = () => {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [todaysShifts, setTodaysShifts] = useState(null);
  const [timesheets, setTimesheets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [workspaceFilter, setWorkspaceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Action dialog
  const [actionDialog, setActionDialog] = useState({ open: false, shift: null, action: '' });
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Export dialog
  const [exportDialog, setExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  useEffect(() => {
    fetchStats();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchTodaysShifts();
    } else if (activeTab === 'all') {
      fetchShifts();
    } else if (activeTab === 'timesheets') {
      fetchTimesheets();
    }
  }, [activeTab, page, workspaceFilter, statusFilter]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/shifts/stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTodaysShifts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/shifts/today`);
      const data = await res.json();
      if (data.success) {
        setTodaysShifts(data);
      }
    } catch (error) {
      console.error('Error fetching today\'s shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30',
        ...(workspaceFilter !== 'all' && { workspace_id: workspaceFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo })
      });
      
      const res = await fetch(`${API_URL}/api/admin/shifts?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setShifts(data.shifts);
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimesheets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30',
        ...(workspaceFilter !== 'all' && { workspace_id: workspaceFilter }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo })
      });
      
      const res = await fetch(`${API_URL}/api/admin/shifts/timesheets?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setTimesheets(data.entries);
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error('Error fetching timesheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/shifts/analytics`);
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const performAction = async () => {
    if (!actionDialog.shift || !actionDialog.action) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/shifts/${actionDialog.shift.id}/action`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: actionDialog.action,
            reason: actionReason
          })
        }
      );
      
      const data = await res.json();
      
      if (data.success) {
        toast({ title: 'Success', description: data.message });
        fetchShifts();
        fetchStats();
        setActionDialog({ open: false, shift: null, action: '' });
        setActionReason('');
      } else {
        throw new Error(data.detail || 'Action failed');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        format: exportFormat,
        ...(workspaceFilter !== 'all' && { workspace_id: workspaceFilter }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo })
      });
      
      const res = await fetch(`${API_URL}/api/admin/shifts/export?${params}`);
      const data = await res.json();
      
      if (data.success) {
        // Create downloadable file
        const content = exportFormat === 'json' 
          ? JSON.stringify(data.export, null, 2)
          : convertToCSV(data.export.data);
        
        const blob = new Blob([content], { 
          type: exportFormat === 'json' ? 'application/json' : 'text/csv' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shifts-export-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({ title: 'Success', description: `Exported ${data.export.total_records} records` });
        setExportDialog(false);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Export failed' });
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(v => `"${v || ''}"`).join(','));
    return [headers, ...rows].join('\n');
  };

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
      cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };
    return styles[status] || styles.scheduled;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <PageTransition>
      <div className="p-6 space-y-6" data-testid="admin-shifts-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-7 h-7 text-indigo-600" />
              Shift Management
            </h1>
            <p className="text-gray-500 mt-1">Cross-workspace shift oversight and analytics</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setExportDialog(true)} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => { fetchStats(); fetchTodaysShifts(); fetchAnalytics(); }} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Shifts</p>
                    <p className="text-2xl font-bold">{stats.total_shifts}</p>
                  </div>
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Today&apos;s Shifts</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.shifts_today}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Now</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active_shifts}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Hours This Month</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.total_hours_this_month}h</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Secondary Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 border-orange-200 dark:border-orange-800/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <UserX className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-xs text-orange-600 font-medium">Unassigned</p>
                    <p className="text-xl font-bold text-orange-700">{stats.unassigned_shifts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 border-red-200 dark:border-red-800/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-xs text-red-600 font-medium">Cancelled</p>
                    <p className="text-xl font-bold text-red-700">{stats.cancelled_shifts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-900/20 dark:to-sky-800/10 border-sky-200 dark:border-sky-800/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-sky-600" />
                  <div>
                    <p className="text-xs text-sky-600 font-medium">This Week</p>
                    <p className="text-xl font-bold text-sky-700">{stats.shifts_this_week}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border-emerald-200 dark:border-emerald-800/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">Total Clock-ins</p>
                    <p className="text-xl font-bold text-emerald-700">{stats.total_clock_ins}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }}>
          <TabsList>
            <TabsTrigger value="overview">Today&apos;s Overview</TabsTrigger>
            <TabsTrigger value="all">All Shifts</TabsTrigger>
            <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Today's Overview Tab */}
          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Today&apos;s Shifts - {todaysShifts?.date}
                </CardTitle>
                <CardDescription>
                  {todaysShifts?.total_shifts || 0} shifts scheduled across all workspaces
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                ) : !todaysShifts?.by_workspace?.length ? (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No shifts scheduled for today</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {todaysShifts.by_workspace.map((group) => (
                      <div key={group.workspace?.id || 'unknown'} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <h3 className="font-semibold">{group.workspace?.name || 'Unknown Workspace'}</h3>
                          <Badge variant="secondary">{group.shifts.length} shifts</Badge>
                        </div>
                        <div className="grid gap-2 pl-6">
                          {group.shifts.map((shift) => (
                            <div 
                              key={shift.id}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-2 h-8 rounded-full"
                                  style={{ backgroundColor: shift.color || '#6366f1' }}
                                />
                                <div>
                                  <p className="font-medium">{shift.title || shift.role || 'Shift'}</p>
                                  <p className="text-sm text-gray-500">
                                    {shift.start_time} - {shift.end_time}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {shift.assignee ? (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-7 h-7">
                                      <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                                        {getInitials(shift.assignee.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{shift.assignee.name}</span>
                                  </div>
                                ) : (
                                  <Badge className="bg-orange-100 text-orange-700">
                                    <UserX className="w-3 h-3 mr-1" />
                                    Unassigned
                                  </Badge>
                                )}
                                <Badge className={getStatusBadge(shift.clock_status || 'scheduled')}>
                                  {shift.clock_status || 'Scheduled'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Shifts Tab */}
          <TabsContent value="all" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>All Shifts</CardTitle>
                    <CardDescription>View and manage shifts across all workspaces</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-[150px]"
                      placeholder="From date"
                    />
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-[150px]"
                      placeholder="To date"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                ) : shifts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No shifts found</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white dark:bg-slate-900">
                        <tr className="border-b text-left">
                          <th className="pb-3 font-medium text-gray-500">Shift</th>
                          <th className="pb-3 font-medium text-gray-500">Workspace</th>
                          <th className="pb-3 font-medium text-gray-500">Assigned To</th>
                          <th className="pb-3 font-medium text-gray-500">Date</th>
                          <th className="pb-3 font-medium text-gray-500">Time</th>
                          <th className="pb-3 font-medium text-gray-500">Status</th>
                          <th className="pb-3 font-medium text-gray-500 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {shifts.map((shift) => (
                          <tr key={shift.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-2 h-6 rounded-full"
                                  style={{ backgroundColor: shift.color || '#6366f1' }}
                                />
                                <span className="font-medium">{shift.title || shift.role || 'Shift'}</span>
                              </div>
                            </td>
                            <td className="py-3">
                              <Badge variant="outline">{shift.workspace?.name || 'Unknown'}</Badge>
                            </td>
                            <td className="py-3">
                              {shift.assignee ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback className="text-xs">
                                      {getInitials(shift.assignee.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{shift.assignee.name}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">Unassigned</span>
                              )}
                            </td>
                            <td className="py-3 text-sm">{shift.date}</td>
                            <td className="py-3 text-sm">
                              {shift.start_time} - {shift.end_time}
                            </td>
                            <td className="py-3">
                              <Badge className={getStatusBadge(shift.status || 'scheduled')}>
                                {shift.status || 'scheduled'}
                              </Badge>
                            </td>
                            <td className="py-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => setActionDialog({ open: true, shift, action: 'cancel' })}
                                    className="text-orange-600"
                                  >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel Shift
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => setActionDialog({ open: true, shift, action: 'delete' })}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timesheets Tab */}
          <TabsContent value="timesheets" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Timesheet Records
                </CardTitle>
                <CardDescription>Clock-in/out records across all workspaces</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                ) : timesheets.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No timesheet records found</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white dark:bg-slate-900">
                        <tr className="border-b text-left">
                          <th className="pb-3 font-medium text-gray-500">Employee</th>
                          <th className="pb-3 font-medium text-gray-500">Workspace</th>
                          <th className="pb-3 font-medium text-gray-500">Clock In</th>
                          <th className="pb-3 font-medium text-gray-500">Clock Out</th>
                          <th className="pb-3 font-medium text-gray-500">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {timesheets.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-7 h-7">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(entry.user?.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{entry.user?.name || 'Unknown'}</p>
                                  <p className="text-xs text-gray-500">{entry.user?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <Badge variant="outline">{entry.workspace?.name || 'Unknown'}</Badge>
                            </td>
                            <td className="py-3 text-sm">
                              {entry.clock_in_time ? format(new Date(entry.clock_in_time), 'MMM d, h:mm a') : '-'}
                            </td>
                            <td className="py-3 text-sm">
                              {entry.clock_out_time ? format(new Date(entry.clock_out_time), 'MMM d, h:mm a') : (
                                <Badge className="bg-green-100 text-green-700">Active</Badge>
                              )}
                            </td>
                            <td className="py-3 text-sm font-medium">
                              {entry.total_hours ? `${entry.total_hours.toFixed(1)}h` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Workspaces by Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Top Workspaces by Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.workspace_hours?.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.workspace_hours.map((ws, idx) => (
                        <div key={ws._id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-400 w-6">{idx + 1}</span>
                            <span className="font-medium">{ws.workspace_name}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{ws.total_hours.toFixed(1)}h</p>
                            <p className="text-xs text-gray-500">{ws.shift_count} shifts</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Top Workers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Top Workers This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.top_workers?.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.top_workers.map((worker, idx) => (
                        <div key={worker._id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-400 w-6">{idx + 1}</span>
                            <span className="font-medium">{worker.user_name}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{worker.total_hours.toFixed(1)}h</p>
                            <p className="text-xs text-gray-500">{worker.shift_count} shifts</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Status Breakdown */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5" />
                    Shift Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.status_breakdown?.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                      {analytics.status_breakdown.map((status) => (
                        <div 
                          key={status._id || 'unknown'} 
                          className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-slate-800 rounded-lg"
                        >
                          <Badge className={getStatusBadge(status._id || 'scheduled')}>
                            {status._id || 'scheduled'}
                          </Badge>
                          <span className="font-bold">{status.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, shift: null, action: '' })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="capitalize">{actionDialog.action} Shift</DialogTitle>
              <DialogDescription>
                                {actionDialog.action === 'delete' 
                  ? 'This shift will be permanently deleted.'
                  : 'This shift will be cancelled.'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter reason for this action..."
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog({ open: false, shift: null, action: '' })}>
                Cancel
              </Button>
              <Button
                onClick={performAction}
                disabled={actionLoading}
                variant={actionDialog.action === 'delete' ? 'destructive' : 'default'}
              >
                {actionLoading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={exportDialog} onOpenChange={setExportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Shifts Data</DialogTitle>
              <DialogDescription>
                Download shift data in your preferred format
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Format</label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">From Date</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">To Date</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default AdminShiftsPage;
