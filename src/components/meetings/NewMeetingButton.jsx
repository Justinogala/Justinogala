
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const NewMeetingButton = ({ onClick, className }) => {
  return (
    <Button 
      onClick={onClick} 
      className={cn("bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 shadow-md", className)}
    >
      <Plus className="w-4 h-4 mr-2" />
      New Meeting
    </Button>
  );
};

export default NewMeetingButton;
