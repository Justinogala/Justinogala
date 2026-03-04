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
  List,
  Settings,
  GripVertical,
  Play,
  Square,
  Timer,
  FileSpreadsheet,
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
  getShiftPresets,
  createShiftPreset,
  deleteShiftPreset,
  clockInOut,
  getClockStatus,
  getWorkspaceTimesheet,
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

// Default preset shift times (fallback if no custom presets)
const DEFAULT_PRESETS = [
  { id: 'default-morning', name: 'Morning', start_time: '06:00', end_time: '14:00', icon: '🌅', color: '#f59e0b', is_default: true },
  { id: 'default-afternoon', name: 'Afternoon', start_time: '14:00', end_time: '22:00', icon: '☀️', color: '#3b82f6', is_default: true },
  { id: 'default-evening', name: 'Evening', start_time: '22:00', end_time: '06:00', icon: '🌙', color: '#6366f1', is_default: true },
];

// Available icons for presets
const PRESET_ICONS = ['🌅', '☀️', '🌙', '⏰', '🌞', '🌜', '🕐', '🕕', '🕘', '📅', '💼', '🏢'];

// ShiftForm component - extracted to avoid nested component definition
const ShiftForm = ({ onSubmit, isEdit, formData, setFormData, members, presets }) => {
  // Handle preset selection
  const applyPreset = (preset) => {
    setFormData({
      ...formData,
      start_time: preset.start_time,
      end_time: preset.end_time,
      color: preset.color,
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Shift Type Presets */}
      {!isEdit && presets.length > 0 && (
        <div className="space-y-2">
          <Label>Quick Select Shift Type</Label>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.id || preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all hover:shadow-md',
                  formData.start_time === preset.start_time && formData.end_time === preset.end_time
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                )}
              >
                <span className="text-2xl">{preset.icon}</span>
                <span className="font-medium text-sm">{preset.name}</span>
                <span className="text-xs text-gray-500">{preset.start_time} - {preset.end_time}</span>
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
          <Label htmlFor="assigned_to">Assign to members in a workspace</Label>
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
  const [showPresetDialog, setShowPresetDialog] = useState(false);

  // Requests
  const [swapRequests, setSwapRequests] = useState([]);
  const [timeOffRequests, setTimeOffRequests] = useState([]);

  // Presets
  const [presets, setPresets] = useState(DEFAULT_PRESETS);
  const [newPreset, setNewPreset] = useState({ name: '', start_time: '09:00', end_time: '17:00', color: '#6366f1', icon: '⏰' });

  // Drag and drop state
  const [draggedShift, setDraggedShift] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);

  // Timesheet state
  const [timesheet, setTimesheet] = useState(null);
  const [clockingShiftId, setClockingShiftId] = useState(null);

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

      // Fetch shift presets
      try {
        const presetsData = await getShiftPresets(workspaceId);
        setPresets(presetsData.presets?.length > 0 ? presetsData.presets : DEFAULT_PRESETS);
      } catch {
        setPresets(DEFAULT_PRESETS);
      }

      // Fetch timesheet data
      try {
        const timesheetData = await getWorkspaceTimesheet(workspaceId);
        setTimesheet(timesheetData);
      } catch {
        setTimesheet(null);
      }

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

  // ============== Drag and Drop Handlers ==============
  
  const handleDragStart = (e, shift) => {
    setDraggedShift(shift);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', shift.id);
    // Add visual feedback
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedShift(null);
    setDragOverDate(null);
  };

  const handleDragOver = (e, date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(format(date, 'yyyy-MM-dd'));
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = async (e, targetDate) => {
    e.preventDefault();
    setDragOverDate(null);
    
    if (!draggedShift) return;
    
    const newDateStr = format(targetDate, 'yyyy-MM-dd');
    
    // Don't update if dropped on the same date
    if (draggedShift.date === newDateStr) {
      setDraggedShift(null);
      return;
    }

    try {
      // Check if Alt key is held - duplicate instead of move
      if (e.altKey) {
        await duplicateShift(draggedShift.id, newDateStr);
        toast({ title: 'Success', description: 'Shift duplicated to new date' });
      } else {
        await updateShift(draggedShift.id, { date: newDateStr });
        toast({ title: 'Success', description: 'Shift moved to new date' });
      }
      fetchData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to move shift',
      });
    }
    
    setDraggedShift(null);
  };

  // ============== Preset Management ==============

  const handleCreatePreset = async () => {
    if (!newPreset.name.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Preset name is required' });
      return;
    }

    try {
      await createShiftPreset({
        workspace_id: workspaceId,
        ...newPreset,
      });
      toast({ title: 'Success', description: 'Preset created successfully' });
      setNewPreset({ name: '', start_time: '09:00', end_time: '17:00', color: '#6366f1', icon: '⏰' });
      
      // Refresh presets
      const presetsData = await getShiftPresets(workspaceId);
      setPresets(presetsData.presets?.length > 0 ? presetsData.presets : DEFAULT_PRESETS);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create preset',
      });
    }
  };

  const handleDeletePreset = async (presetId) => {
    try {
      await deleteShiftPreset(presetId);
      toast({ title: 'Success', description: 'Preset deleted' });
      
      // Refresh presets
      const presetsData = await getShiftPresets(workspaceId);
      setPresets(presetsData.presets?.length > 0 ? presetsData.presets : DEFAULT_PRESETS);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete preset',
      });
    }
  };

  // Handle export
  const handleExport = async (exportFormat) => {
    try {
      const monthStartDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEndDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      await downloadExport(workspaceId, exportFormat, monthStartDate, monthEndDate);
      toast({ title: 'Success', description: 'Export downloaded' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to export shifts',
      });
    }
  };

  // ============== Clock In/Out Handlers ==============

  const handleClockInOut = async (shift, action) => {
    if (!user?.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please log in' });
      return;
    }

    try {
      setClockingShiftId(shift.id);
      const result = await clockInOut(shift.id, user.id, action);
      
      toast({
        title: 'Success',
        description: result.message,
      });

      // Refresh data
      fetchData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || `Failed to clock ${action}`,
      });
    } finally {
      setClockingShiftId(null);
    }
  };

  // Check if current user is assigned to shift
  const isMyShift = (shift) => {
    return shift.assigned_to === user?.id;
  };

  // Check if shift is happening today
  const isShiftToday = (shift) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return shift.date === today;
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
        <Button variant="outline" size="sm" onClick={() => setShowPresetDialog(true)} data-testid="manage-presets-btn">
          <Settings className="h-4 w-4 mr-2" />
          Presets
        </Button>
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
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayStr = format(cloneDay, 'yyyy-MM-dd');
        const dayShifts = getShiftsForDate(cloneDay);
        const isToday = isSameDay(day, new Date());
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isDragOver = dragOverDate === dayStr;

        days.push(
          <div
            key={day.toString()}
            onClick={() => openCreateForDate(cloneDay)}
            onDragOver={(e) => handleDragOver(e, cloneDay)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, cloneDay)}
            className={cn(
              'min-h-[120px] border border-gray-100 dark:border-gray-800 p-2 cursor-pointer transition-all',
              !isCurrentMonth && 'bg-gray-50/50 dark:bg-gray-900/50',
              isToday && 'bg-indigo-50/50 dark:bg-indigo-950/20 ring-1 ring-inset ring-indigo-500',
              isDragOver && 'bg-indigo-100 dark:bg-indigo-900/40 ring-2 ring-indigo-500 ring-inset',
              !isDragOver && 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
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
                  draggable
                  onDragStart={(e) => handleDragStart(e, shift)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'text-xs px-2 py-1 rounded truncate cursor-grab active:cursor-grabbing hover:opacity-80 flex items-center gap-1 group',
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
                  <GripVertical className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 overflow-hidden">
                    <div className="font-medium flex items-center gap-1">
                      {shift.start_time} - {shift.end_time}
                      {shift.clock_status === 'clocked_in' && (
                        <Timer className="h-3 w-3 text-emerald-600" />
                      )}
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 truncate">
                      {shift.assigned_to_name || 'Unassigned'}
                    </div>
                  </div>
                  {/* Clock In/Out button for today's shifts assigned to current user */}
                  {isMyShift(shift) && isShiftToday(shift) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClockInOut(shift, shift.clock_status === 'clocked_in' ? 'out' : 'in');
                      }}
                      disabled={clockingShiftId === shift.id}
                      className={cn(
                        'p-1 rounded transition-colors flex-shrink-0',
                        shift.clock_status === 'clocked_in'
                          ? 'bg-red-100 hover:bg-red-200 text-red-600'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-600'
                      )}
                      data-testid={shift.clock_status === 'clocked_in' ? `cal-clock-out-${shift.id}` : `cal-clock-in-${shift.id}`}
                      title={shift.clock_status === 'clocked_in' ? 'Clock Out' : 'Clock In'}
                    >
                      {clockingShiftId === shift.id ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : shift.clock_status === 'clocked_in' ? (
                        <Square className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </button>
                  )}
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
                    {/* Clock In/Out buttons for assigned user on today's shifts */}
                    {isMyShift(shift) && isShiftToday(shift) && (
                      shift.clock_status === 'clocked_in' ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleClockInOut(shift, 'out')}
                          disabled={clockingShiftId === shift.id}
                          data-testid={`clock-out-${shift.id}`}
                        >
                          {clockingShiftId === shift.id ? (
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Square className="h-4 w-4 mr-1" />
                          )}
                          Clock Out
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleClockInOut(shift, 'in')}
                          disabled={clockingShiftId === shift.id}
                          data-testid={`clock-in-${shift.id}`}
                        >
                          {clockingShiftId === shift.id ? (
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-1" />
                          )}
                          Clock In
                        </Button>
                      )
                    )}
                    {shift.clock_status === 'clocked_in' && (
                      <Badge className="bg-emerald-100 text-emerald-700">
                        <Timer className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
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
            <TabsTrigger value="timesheet" className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Timesheet
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

          <TabsContent value="timesheet">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5" />
                      Time Tracking
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {timesheet?.period?.start} - {timesheet?.period?.end}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{timesheet?.total_hours || 0}h</p>
                    <p className="text-sm text-gray-500">Total hours this week</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!timesheet?.users?.length ? (
                  <div className="text-center py-12 text-gray-500">
                    <Timer className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No time entries recorded yet</p>
                    <p className="text-sm">Clock in/out buttons appear on today&apos;s shifts</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {timesheet.users.map((userData) => (
                      <div 
                        key={userData.user_id}
                        className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                              {(userData.user_name || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{userData.user_name}</p>
                              <p className="text-sm text-gray-500">{userData.user_email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-indigo-600">{userData.total_hours}h</p>
                            <p className="text-xs text-gray-500">{userData.entry_count} entries</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {userData.entries?.slice(0, 5).map((entry) => (
                            <Badge key={entry.id} variant="secondary" className="text-xs">
                              {entry.clock_in?.slice(5, 10)} • {Math.round(entry.duration_minutes)}min
                            </Badge>
                          ))}
                          {userData.entries?.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{userData.entries.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Shift</DialogTitle>
            <DialogDescription>
              Schedule a new shift for your team. Drag shifts on the calendar to reschedule, or hold Alt while dragging to duplicate.
            </DialogDescription>
          </DialogHeader>
          <ShiftForm onSubmit={handleCreateShift} isEdit={false} formData={formData} setFormData={setFormData} members={members} presets={presets} />
        </DialogContent>
      </Dialog>

      {/* Edit Shift Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
            <DialogDescription>
              Update shift details
            </DialogDescription>
          </DialogHeader>
          <ShiftForm onSubmit={handleUpdateShift} isEdit={true} formData={formData} setFormData={setFormData} members={members} presets={presets} />
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

      {/* Preset Management Dialog */}
      <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Shift Presets</DialogTitle>
            <DialogDescription>
              Create custom shift presets for quick scheduling. These presets will appear in the Create Shift dialog.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Existing Presets */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Current Presets</Label>
              <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto">
                {presets.map((preset) => (
                  <div
                    key={preset.id || preset.name}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    style={{ borderLeftColor: preset.color, borderLeftWidth: '4px' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{preset.icon}</span>
                      <div>
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-sm text-gray-500">{preset.start_time} - {preset.end_time}</div>
                      </div>
                    </div>
                    {!preset.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePreset(preset.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {preset.is_default && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Create New Preset */}
            <div className="space-y-4 border-t pt-4">
              <Label className="text-sm font-medium">Create New Preset</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preset-name">Name</Label>
                  <Input
                    id="preset-name"
                    placeholder="e.g., Night Shift"
                    value={newPreset.name}
                    onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="flex gap-1 flex-wrap">
                    {PRESET_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewPreset({ ...newPreset, icon })}
                        className={cn(
                          'w-8 h-8 rounded-lg border flex items-center justify-center text-lg transition-all',
                          newPreset.icon === icon 
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950' 
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preset-start">Start Time</Label>
                  <Input
                    id="preset-start"
                    type="time"
                    value={newPreset.start_time}
                    onChange={(e) => setNewPreset({ ...newPreset, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preset-end">End Time</Label>
                  <Input
                    id="preset-end"
                    type="time"
                    value={newPreset.end_time}
                    onChange={(e) => setNewPreset({ ...newPreset, end_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-1 flex-wrap">
                    {SHIFT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setNewPreset({ ...newPreset, color: color.value })}
                        className={cn(
                          'w-6 h-6 rounded-full transition-all',
                          newPreset.color === color.value && 'ring-2 ring-offset-2 ring-gray-400'
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={handleCreatePreset} className="w-full" data-testid="create-preset-btn">
                <Plus className="h-4 w-4 mr-2" />
                Create Preset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShiftManagementPage;
