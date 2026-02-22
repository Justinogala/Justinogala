
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

const UploadButton = ({ onClick, className }) => {
  return (
    <Button 
      onClick={onClick} 
      className={cn("bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/20 shadow-md", className)}
    >
      <Upload className="w-4 h-4 mr-2" />
      Upload File
    </Button>
  );
};

export default UploadButton;
