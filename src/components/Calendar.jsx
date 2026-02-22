
import React, { useState } from 'react';
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
  subMonths 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const Calendar = ({ events = [], onDateClick, onEventClick, className }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const renderHeader = () => {
    const dateFormat = "MMMM yyyy";
    return (
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-lg font-bold">
          {format(currentMonth, dateFormat)}
        </span>
        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
          Today
        </Button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const dateFormat = "EEE";
    let startDate = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center font-medium text-sm text-muted-foreground py-2" key={i}>
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2 border-b border-border">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        // Find events for this day
        const dayEvents = events.filter(e => isSameDay(new Date(e.startTime), cloneDay));

        days.push(
          <div
            className={cn(
              "min-h-[100px] border border-border/40 p-1 relative transition-colors hover:bg-accent/20 cursor-pointer flex flex-col gap-1",
              !isSameMonth(day, monthStart) ? "text-muted-foreground bg-muted/20" : "",
              isSameDay(day, new Date()) ? "bg-indigo-500/10 ring-1 ring-inset ring-indigo-500" : ""
            )}
            key={day}
            onClick={() => onDateClick && onDateClick(cloneDay)}
          >
            <div className="flex justify-between items-start">
              <span className={cn(
                "text-xs font-semibold p-1 rounded-full w-6 h-6 flex items-center justify-center",
                isSameDay(day, new Date()) ? "bg-indigo-500 text-white" : "text-muted-foreground"
              )}>
                {formattedDate}
              </span>
            </div>
            
            <div className="flex flex-col gap-1 overflow-hidden">
              {dayEvents.map(event => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "text-[10px] truncate px-1.5 py-0.5 rounded border-l-2 cursor-pointer transition-transform hover:scale-105",
                    event.status === 'cancelled' ? "bg-gray-100 text-gray-500 border-gray-400 line-through dark:bg-gray-800" : "bg-indigo-100 text-indigo-700 border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-200"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick && onEventClick(event);
                  }}
                >
                   {format(new Date(event.startTime), 'HH:mm')} {event.title}
                </motion.div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="border border-border rounded-lg overflow-hidden bg-card">{rows}</div>;
  };

  return (
    <div className={cn("p-4", className)}>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
};

export default Calendar;
