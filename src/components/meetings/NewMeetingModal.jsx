
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarPlus, X, Loader2 } from 'lucide-react';
import MeetingForm from './MeetingForm';
import { useMeetingForm } from '@/hooks/useMeetingForm';

const NewMeetingModal = ({ isOpen, onClose, onCreateMeeting }) => {
  const {
    formData,
    errors,
    handleChange,
    handleSelectChange,
    validate,
    resetForm
  } = useMeetingForm();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setIsSubmitting(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (onCreateMeeting) {
      onCreateMeeting(formData);
    }
    
    setIsSubmitting(false);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl rounded-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="relative p-6 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 dark:from-indigo-900/20 dark:to-blue-900/20 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-indigo-600" />
              Schedule New Meeting
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Set up a new meeting and invite participants.
            </DialogDescription>
          </DialogHeader>
          <button 
            onClick={handleClose} 
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <MeetingForm 
            formData={formData} 
            onChange={handleChange} 
            onSelectChange={handleSelectChange}
            errors={errors}
          />
        </div>

        <div className="p-6 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800 flex-shrink-0">
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
              </>
            ) : (
              'Create Meeting'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewMeetingModal;
