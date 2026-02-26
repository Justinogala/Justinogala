import React, { useState } from 'react';
import { Clock, Calendar, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format, addHours, addDays, setHours, setMinutes } from 'date-fns';

const ScheduleMessagePicker = ({ message, onSchedule }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const quickOptions = [
    { label: 'In 1 hour', getValue: () => addHours(new Date(), 1) },
    { label: 'In 3 hours', getValue: () => addHours(new Date(), 3) },
    { label: 'Tomorrow morning', getValue: () => setMinutes(setHours(addDays(new Date(), 1), 9), 0) },
    { label: 'Tomorrow afternoon', getValue: () => setMinutes(setHours(addDays(new Date(), 1), 14), 0) },
  ];

  const handleQuickSelect = (option) => {
    const date = option.getValue();
    setSelectedDate(format(date, 'yyyy-MM-dd'));
    setSelectedTime(format(date, 'HH:mm'));
  };

  const handleSchedule = () => {
    if (selectedDate && selectedTime && message?.trim()) {
      const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}`);
      onSchedule({
        message: message.trim(),
        scheduledFor: scheduledDateTime.toISOString(),
        createdAt: new Date().toISOString()
      });
      setSelectedDate('');
      setSelectedTime('');
      setIsOpen(false);
    }
  };

  const isValid = selectedDate && selectedTime && message?.trim();
  const minDate = format(new Date(), 'yyyy-MM-dd');
  const minTime = selectedDate === minDate ? format(addHours(new Date(), 1), 'HH:mm') : '00:00';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button 
          type="button" 
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!message?.trim()}
        >
          <Clock className="w-4 h-4 text-green-500" />
          <span>Schedule Message</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-500" />
            Schedule Message
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Message Preview */}
          <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <p className="text-xs text-gray-500 mb-1">Message to send:</p>
            <p className="text-sm text-gray-900 dark:text-white line-clamp-3">
              {message || 'No message entered'}
            </p>
          </div>

          {/* Quick Options */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick select</Label>
            <div className="grid grid-cols-2 gap-2">
              {quickOptions.map((option, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(option)}
                  className="text-xs justify-start"
                >
                  <Clock className="w-3 h-3 mr-2" />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Date/Time */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Or pick a specific time</Label>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={minDate}
                    className="pl-9 bg-gray-50 dark:bg-slate-800"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    min={minTime}
                    className="pl-9 bg-gray-50 dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Scheduled Preview */}
          {selectedDate && selectedTime && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/30">
              <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Will be sent on {format(new Date(`${selectedDate}T${selectedTime}`), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
              onClick={handleSchedule}
              disabled={!isValid}
            >
              <Send className="w-4 h-4 mr-2" /> Schedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleMessagePicker;
