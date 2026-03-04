import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  format,
  startOfWeek,
  addDays,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  Edit2,
  Trash2,
  Copy,
  User,
  ArrowLeftRight,
  CalendarOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getWorkspaceShifts,
  getWorkspaceSummary,
  createShift,
  updateShift,
  deleteShift,
  duplicateShift,
  getSwapRequests,
  getTimeOffRequests,
  approveSwapRequest,
  rejectSwapRequest,
  handleTimeOffRequest,
  downloadExport,
  getUserHours,
} from '@/services/shiftService';
import { getWorkspaceById, getMembers } from '@/services/workspaceService';

// Color options for shifts
const SHIFT_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Orange', value: '#f97316' },
];

// Preset shift times
const SHIFT_PRESETS = [
  { name: 'Morning', start: '06:00', end: '14:00', icon: '🌅', color: '#f59e0b' },
  { name: 'Afternoon', start: '14:00', end: '22:00', icon: '☀️', color: '#3b82f6' },
  { name: 'Evening', start: '22:00', end: '06:00', icon: '🌙', color: '#6366f1' },
];

// ShiftForm component - extracted to avoid nested component definition
const ShiftForm = ({ onSubmit, isEdit, formData, setFormData, members }) => {
  // Handle preset selection
  const applyPreset = (preset) => {
    setFormData({
      ...formData,
      start_time: preset.start,
      end_time: preset.end,
      color: preset.color,
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Shift Type Presets */}
      {!isEdit && (
        <div className="space-y-2">
          <Label>Quick Select Shift Type</Label>
          <div className="grid grid-cols-3 gap-2">
            {SHIFT_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all hover:shadow-md',
                  formData.start_time === preset.start && formData.end_time === preset.end
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                )}
              >
                <span className="text-2xl">{preset.icon}</span>
                <span className="font-medium text-sm">{preset.name}</span>
                <span className="text-xs text-gray-500">{preset.start} - {preset.end}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="assigned_to">Assign To (Workspace Member)</Label>
          <Select
            value={formData.assigned_to || 'unassigned'}
            onValueChange={(value) => setFormData({ ...formData, assigned_to: value === 'unassigned' ? '' : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>Unassigned</span>
                </div>
              </SelectItem>
              {members.length > 0 ? (
                members.map((member) => (
                  <SelectItem key={member.user_id || member.id} value={member.user_id || member.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                        {(member.name || member.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span>{member.name || member.email}</span>
                        {member.role && (
                          <span className="text-xs text-gray-500">{member.role}</span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-members" disabled>
                  <span className="text-gray-400">No workspace members found</span>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {members.length === 0 && (
            <p className="text-xs text-amber-600">Add members to your workspace to assign shifts</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">Start Time</Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">End Time</Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            placeholder="e.g., Cashier, Manager"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            placeholder="e.g., Sales, Support"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex gap-2 flex-wrap">
          {SHIFT_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setFormData({ ...formData, color: color.value })}
              className={cn(
                'w-8 h-8 rounded-full transition-all',
                formData.color === color.value && 'ring-2 ring-offset-2 ring-gray-400'
              )}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>

    <div className="space-y-2">
      <Label htmlFor="notes">Notes</Label>
      <Textarea
        id="notes"
        placeholder="Additional notes..."
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        rows={3}
      />
    </div>

    {!isEdit && (
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_recurring"
            checked={formData.is_recurring}
            onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="is_recurring">Make this a recurring shift</Label>
        </div>

        {formData.is_recurring && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recurrence_pattern">Repeat</Label>
              <Select
                value={formData.recurrence_pattern}
                onValueChange={(value) => setFormData({ ...formData, recurrence_pattern: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurrence_end_date">Until</Label>
              <Input
                id="recurrence_end_date"
                type="date"
                value={formData.recurrence_end_date}
                onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>
    )}

    <DialogFooter>
      <Button type="submit" data-testid="submit-shift-btn">
        {isEdit ? 'Update Shift' : 'Create Shift'}
      </Button>
    </DialogFooter>
  </form>
  );
};

const ShiftManagementPage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [workspace, setWorkspace] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState({});
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // calendar, list
  const [activeTab, setActiveTab] = useState('shifts');

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingShift, setDeletingShift] = useState(null);

  // Requests
  const [swapRequests, setSwapRequests] = useState([]);
  const [timeOffRequests, setTimeOffRequests] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    date: '',
    start_time: '09:00',
    end_time: '17:00',
    assigned_to: '',
    role: '',
    department: '',
    notes: '',
    color: '#6366f1',
    is_recurring: false,
    recurrence_pattern: '',
    recurrence_end_date: '',
  });

  // Workspace members for assignment
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (workspaceId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, currentMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch workspace details
      const wsData = await getWorkspaceById(workspaceId);
      setWorkspace(wsData);

      // Fetch shifts for current month view
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const startDate = format(startOfWeek(monthStart), 'yyyy-MM-dd');
      const endDate = format(endOfWeek(monthEnd), 'yyyy-MM-dd');

      const shiftsResponse = await getWorkspaceShifts(workspaceId, {
        startDate,
        endDate,
      });

      setShifts(shiftsResponse.shifts || []);
      setUsers(shiftsResponse.users || {});

      // Fetch summary
      const summaryData = await getWorkspaceSummary(workspaceId);
      setSummary(summaryData.summary);

      // Fetch requests
      const swapData = await getSwapRequests(workspaceId);
      setSwapRequests(swapData.requests || []);

      const timeOffData = await getTimeOffRequests(workspaceId);
      setTimeOffRequests(timeOffData.requests || []);

      // Fetch workspace members from API
      const workspaceMembers = await getMembers(workspaceId);
      setMembers(workspaceMembers || []);

    } catch (error) {
      console.error('Error fetching shift data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load shift data',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get shifts for a specific date
  const getShiftsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.filter(s => s.date === dateStr);
  };

  // Handle shift creation
  const handleCreateShift = async (e) => {
    e.preventDefault();
    try {
      const shiftData = {
        workspace_id: workspaceId,
        ...formData,
      };

      await createShift(shiftData);
      toast({ title: 'Success', description: 'Shift created successfully' });
      setShowCreateDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create shift',
      });
    }
  };

  // Handle shift update
  const handleUpdateShift = async (e) => {
    e.preventDefault();
    if (!editingShift) return;

    try {
      await updateShift(editingShift.id, formData);
      toast({ title: 'Success', description: 'Shift updated successfully' });
      setShowEditDialog(false);
      setEditingShift(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update shift',
      });
    }
  };

  // Handle shift deletion
  const handleDeleteShift = async () => {
    if (!deletingShift) return;

    try {
      await deleteShift(deletingShift.id, deletingShift.is_recurring);
      toast({ title: 'Success', description: 'Shift deleted successfully' });
      setShowDeleteConfirm(false);
      setDeletingShift(null);
      fetchData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete shift',
      });
    }
  };

  // Handle shift duplication
  const handleDuplicateShift = async (shift) => {
    try {
      const newDate = format(addDays(parseISO(shift.date), 1), 'yyyy-MM-dd');
      await duplicateShift(shift.id, newDate);
      toast({ title: 'Success', description: 'Shift duplicated successfully' });
      fetchData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to duplicate shift',
      });
    }
  };

  // Handle swap request actions
  const handleSwapAction = async (requestId, action) => {
    try {
      if (action === 'approve') {
        await approveSwapRequest(requestId);
      } else {
        await rejectSwapRequest(requestId);
      }
      toast({ title: 'Success', description: `Swap request ${action}d` });
      fetchData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || `Failed to ${action} swap request`,
      });
    }
  };

  // Handle time off request actions
  const handleTimeOffAction = async (requestId, action) => {
    try {
      await handleTimeOffRequest(requestId, action);
      toast({ title: 'Success', description: `Time off request ${action}d` });
      fetchData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || `Failed to ${action} time off request`,
      });
    }
  };

  // Handle export
  const handleExport = async (format) => {
    try {
      const monthStart = format === 'csv' ? format(startOfMonth(currentMonth), 'yyyy-MM-dd') : null;
      const monthEnd = format === 'csv' ? format(endOfMonth(currentMonth), 'yyyy-MM-dd') : null;
      await downloadExport(workspaceId, format, monthStart, monthEnd);
      toast({ title: 'Success', description: 'Export downloaded' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to export shifts',
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
      start_time: '09:00',
      end_time: '17:00',
      assigned_to: '',
      role: '',
      department: '',
      notes: '',
      color: '#6366f1',
      is_recurring: false,
      recurrence_pattern: '',
      recurrence_end_date: '',
    });
  };

  // Open edit dialog
  const openEditDialog = (shift) => {
    setEditingShift(shift);
    setFormData({
      date: shift.date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      assigned_to: shift.assigned_to || '',
      role: shift.role || '',
      department: shift.department || '',
      notes: shift.notes || '',
      color: shift.color || '#6366f1',
      is_recurring: shift.is_recurring || false,
      recurrence_pattern: shift.recurrence_pattern || '',
      recurrence_end_date: shift.recurrence_end_date || '',
    });
    setShowEditDialog(true);
  };

  // Open create dialog for specific date
  const openCreateForDate = (date) => {
    setSelectedDate(date);
    setFormData(prev => ({
      ...prev,
      date: format(date, 'yyyy-MM-dd'),
    }));
    setShowCreateDialog(true);
  };

  // Render calendar header
  const renderCalendarHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
          Today
        </Button>
        <div className="flex border rounded-lg overflow-hidden">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none"
            onClick={() => setViewMode('calendar')}
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('json')}>
              Export as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="create-shift-btn">
          <Plus className="h-4 w-4 mr-2" />
          Create Shift
        </Button>
      </div>
    </div>
  );

  // Render calendar days header
  const renderDaysHeader = () => {
    const days = [];
    const dateFormat = 'EEE';
    const startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div
          key={i}
          className="text-center font-medium text-sm text-gray-500 dark:text-gray-400 py-3 border-b"
        >
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }

    return <div className="grid grid-cols-7">{days}</div>;
  };

  // Render calendar cells
  const renderCalendarCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayShifts = getShiftsForDate(cloneDay);
        const isToday = isSameDay(day, new Date());
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            onClick={() => openCreateForDate(cloneDay)}
            className={cn(
              'min-h-[120px] border border-gray-100 dark:border-gray-800 p-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50',
              !isCurrentMonth && 'bg-gray-50/50 dark:bg-gray-900/50',
              isToday && 'bg-indigo-50/50 dark:bg-indigo-950/20 ring-1 ring-inset ring-indigo-500'
            )}
          >
            <div className="flex justify-between items-start mb-1">
              <span
                className={cn(
                  'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                  isToday && 'bg-indigo-600 text-white',
                  !isToday && !isCurrentMonth && 'text-gray-400'
                )}
              >
                {format(day, 'd')}
              </span>
              {dayShifts.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {dayShifts.length}
                </Badge>
              )}
            </div>
            <div className="space-y-1 overflow-hidden max-h-[80px]">
              {dayShifts.slice(0, 3).map((shift) => (
                <motion.div
                  key={shift.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80',
                    shift.status === 'cancelled' && 'line-through opacity-50'
                  )}
                  style={{
                    backgroundColor: `${shift.color}20`,
                    borderLeft: `3px solid ${shift.color}`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditDialog(shift);
                  }}
                  data-testid={`shift-${shift.id}`}
                >
                  <div className="font-medium">{shift.start_time} - {shift.end_time}</div>
                  <div className="text-gray-600 dark:text-gray-300 truncate">
                    {shift.assigned_to_name || 'Unassigned'}
                  </div>
                </motion.div>
              ))}
              {dayShifts.length > 3 && (
                <div className="text-xs text-gray-500 pl-2">
                  +{dayShifts.length - 3} more
                </div>
              )}
            </div>
          </div>
        );

        day = addDays(day, 1);
      }

      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">{rows}</div>;
  };

  // Render list view
  const renderListView = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const monthShifts = shifts.filter(s => {
      const shiftDate = parseISO(s.date);
      return shiftDate >= monthStart && shiftDate <= monthEnd;
    });

    return (
      <div className="space-y-2">
        {monthShifts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No shifts scheduled for this month</p>
          </div>
        ) : (
          monthShifts.map((shift) => (
            <Card key={shift.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-2 h-12 rounded-full"
                      style={{ backgroundColor: shift.color }}
                    />
                    <div>
                      <div className="font-medium">
                        {format(parseISO(shift.date), 'EEE, MMM d')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {shift.start_time} - {shift.end_time} ({shift.hours}h)
                      </div>
                    </div>
                    <div className="border-l pl-4">
                      <div className="font-medium">
                        {shift.assigned_to_name || 'Unassigned'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {shift.role || 'No role specified'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={shift.status === 'scheduled' ? 'default' : 'secondary'}
                      className={shift.status === 'cancelled' ? 'bg-red-100 text-red-700' : ''}
                    >
                      {shift.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(shift)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateShift(shift)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setDeletingShift(shift);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  };

  // Render summary cards
  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today&apos;s Shifts</p>
              <p className="text-2xl font-bold">{summary?.today_shifts || 0}</p>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Calendar className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Week Total Hours</p>
              <p className="text-2xl font-bold">{summary?.week_total_hours || 0}h</p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Team</p>
              <p className="text-2xl font-bold">{summary?.active_users || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Requests</p>
              <p className="text-2xl font-bold">
                {(summary?.pending_swap_requests || 0) + (summary?.pending_timeoff_requests || 0)}
              </p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render requests tab
  const renderRequestsTab = () => (
    <div className="space-y-6">
      {/* Swap Requests */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5" />
          Swap Requests
        </h3>
        {swapRequests.filter(r => r.status === 'pending').length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No pending swap requests
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {swapRequests.filter(r => r.status === 'pending').map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {request.requester_name} → {request.target_user_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {request.shift_date} • {request.shift_time}
                      </p>
                      {request.reason && (
                        <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600"
                        onClick={() => handleSwapAction(request.id, 'approve')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => handleSwapAction(request.id, 'reject')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Time Off Requests */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CalendarOff className="h-5 w-5" />
          Time Off Requests
        </h3>
        {timeOffRequests.filter(r => r.status === 'pending').length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No pending time off requests
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {timeOffRequests.filter(r => r.status === 'pending').map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{request.user_name}</p>
                      <p className="text-sm text-gray-500">
                        {request.start_date} - {request.end_date}
                      </p>
                      <Badge variant="secondary" className="mt-1">{request.type}</Badge>
                      {request.reason && (
                        <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600"
                        onClick={() => handleTimeOffAction(request.id, 'approve')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => handleTimeOffAction(request.id, 'reject')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 p-6" data-testid="shift-management-page">
      <Helmet>
        <title>Shift Management | {workspace?.name || 'Workspace'}</title>
      </Helmet>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/workspace/${workspaceId}/manage`)}
            className="mb-2 -ml-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Workspace
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Shift Management
          </h1>
          <p className="text-gray-500">{workspace?.name}</p>
        </div>

        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="shifts" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Shifts
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Requests
              {((summary?.pending_swap_requests || 0) + (summary?.pending_timeoff_requests || 0)) > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {(summary?.pending_swap_requests || 0) + (summary?.pending_timeoff_requests || 0)}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shifts">
            <Card>
              <CardContent className="p-6">
                {renderCalendarHeader()}
                {viewMode === 'calendar' ? (
                  <>
                    {renderDaysHeader()}
                    {renderCalendarCells()}
                  </>
                ) : (
                  renderListView()
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            {renderRequestsTab()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Shift Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Shift</DialogTitle>
            <DialogDescription>
              Schedule a new shift for your team
            </DialogDescription>
          </DialogHeader>
          <ShiftForm onSubmit={handleCreateShift} isEdit={false} formData={formData} setFormData={setFormData} members={members} />
        </DialogContent>
      </Dialog>

      {/* Edit Shift Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
            <DialogDescription>
              Update shift details
            </DialogDescription>
          </DialogHeader>
          <ShiftForm onSubmit={handleUpdateShift} isEdit={true} formData={formData} setFormData={setFormData} members={members} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shift</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this shift? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteShift}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShiftManagementPage;
