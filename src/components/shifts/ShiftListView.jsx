import React from 'react';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GripVertical, Timer, Square, Play, RefreshCw, MoreHorizontal, Pencil, Trash2, Copy } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

const ShiftListView = ({
  shifts,
  currentMonth,
  isMyShift,
  isShiftToday,
  clockingShiftId,
  handleClockInOut,
  openEditDialog,
  handleDuplicateShift,
  handleDeleteShift
}) => {
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  const monthShifts = shifts.filter(s => {
    const shiftDate = parseISO(s.date);
    return shiftDate >= monthStart && shiftDate <= monthEnd;
  });

  if (monthShifts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <Timer className="w-8 h-8 text-gray-400" />
        </div>
        <p>No shifts scheduled for this month</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {monthShifts.map((shift) => (
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
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(shift)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateShift(shift)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDeleteShift(shift.id)}
                      className="text-red-600"
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
      ))}
    </div>
  );
};

export default ShiftListView;
