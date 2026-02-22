
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { meetingService } from '@/services/meetingService';
import { X, Plus, Calendar, Clock, AlignLeft, Users, Loader2 } from 'lucide-react';
import { isPast, parseISO } from 'date-fns';

const NewMeetingModal = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    description: '',
    participants: []
  });
  const [participantInput, setParticipantInput] = useState('');
  const [errors, setErrors] = useState({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ title: '', date: '', time: '', description: '', participants: [] });
      setParticipantInput('');
      setErrors({});
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleAddParticipant = (e) => {
    e.preventDefault(); 
    if (participantInput && /\S+@\S+\.\S+/.test(participantInput)) {
      if (!formData.participants.includes(participantInput)) {
        setFormData(prev => ({ 
          ...prev, 
          participants: [...prev.participants, participantInput] 
        }));
        setParticipantInput('');
      } else {
        toast({ title: "Duplicate Email", description: "This email is already added.", variant: "destructive" });
      }
    } else {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
    }
  };

  const removeParticipant = (email) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p !== email)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Meeting title is required";
    if (!formData.date) {
      newErrors.date = "Date is required";
    } else {
      const meetingDateTime = parseISO(`${formData.date}T${formData.time || '00:00'}`);
      if (isPast(meetingDateTime) && new Date().toDateString() !== meetingDateTime.toDateString()) {
        newErrors.date = "Meeting cannot be scheduled in the past";
      }
    }
    if (!formData.time) newErrors.time = "Time is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await meetingService.createMeeting({
        ...formData,
        attendees: formData.participants
      });
      
      toast({
        title: "Success",
        description: "Meeting created successfully",
        className: "bg-green-600 text-white border-none"
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create meeting. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Meeting" className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6">
          <Input
            label="Meeting Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
            placeholder="e.g. Weekly Team Sync"
            required
            disabled={isLoading}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <Input
                label="Date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                error={errors.date}
                required
                disabled={isLoading}
                icon={<Calendar className="w-4 h-4 text-gray-400" />}
              />
            </div>
            <div className="relative">
              <Input
                label="Time"
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                error={errors.time}
                required
                disabled={isLoading}
                icon={<Clock className="w-4 h-4 text-gray-400" />}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2 flex items-center gap-2">
              <AlignLeft className="w-4 h-4" /> Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none disabled:opacity-50"
              placeholder="Meeting agenda and details..."
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" /> Participants (Optional)
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                placeholder="colleague@example.com"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant(e)}
                disabled={isLoading}
              />
              <Button type="button" onClick={handleAddParticipant} variant="secondary" disabled={isLoading}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {formData.participants.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.participants.map(email => (
                  <div key={email} className="flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-sm">
                    <span>{email}</span>
                    <button 
                      type="button" 
                      onClick={() => removeParticipant(email)} 
                      className="hover:text-white ml-1"
                      disabled={isLoading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]" disabled={isLoading}>
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : 'Create Meeting'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default NewMeetingModal;
