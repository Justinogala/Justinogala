
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { X, Loader2, Calendar, Clock, Globe, Lock } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const NewMeetingDialog = ({ isOpen, onClose, onCreate }) => {
  const [meetingId, setMeetingId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    password: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    timezone: '',
  });

  useEffect(() => {
    if (isOpen) {
      setMeetingId(uuidv4().slice(0, 8)); // Generate short ID
      setFormData({
        title: '',
        description: '',
        password: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        timezone: '',
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return;

    setIsLoading(true);
    // Simulate slight delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const newMeeting = {
      id: meetingId,
      ...formData,
      createdAt: new Date().toISOString()
    };

    onCreate(newMeeting);
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 gap-0 block">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Create Meeting 
            <span className="text-sm font-normal text-gray-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700 ml-2 font-mono">
              ID: {meetingId}
            </span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-200/50 dark:hover:bg-slate-700/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g. Q3 Marketing Sync"
              required
              className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 focus:border-violet-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-200">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Meeting agenda and details..."
              className="bg-gray-50 dark:bg-slate-800 resize-none h-24 border-gray-200 dark:border-slate-700 focus:border-violet-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" /> Password (Optional)
            </Label>
            <Input
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Secure meeting password"
              className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 focus:border-violet-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 focus:border-violet-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Time
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 focus:border-violet-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" /> Time Zone
            </Label>
            <Select 
              value={formData.timezone} 
              onValueChange={(val) => setFormData({...formData, timezone: val})}
            >
              <SelectTrigger className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 focus:ring-violet-500">
                <SelectValue placeholder="Select meeting timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC (Universal Time)</SelectItem>
                <SelectItem value="EST">EST (Eastern Standard Time)</SelectItem>
                <SelectItem value="PST">PST (Pacific Standard Time)</SelectItem>
                <SelectItem value="GMT">GMT (Greenwich Mean Time)</SelectItem>
                <SelectItem value="CET">CET (Central European Time)</SelectItem>
                <SelectItem value="IST">IST (Indian Standard Time)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800 mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="border-gray-200">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-violet-600 hover:bg-violet-700 text-white min-w-[150px] shadow-lg shadow-violet-500/20"
              disabled={isLoading || !formData.title}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                </>
              ) : (
                'Create new meeting'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewMeetingDialog;
