
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const TranscriptionStatusBadge = ({ status, className }) => {
  const normalizeStatus = (status || '').toLowerCase();
  
  let variant = 'secondary';
  let Icon = Clock;
  let label = status || 'Unknown';
  let colorClass = 'bg-gray-100 text-gray-800 hover:bg-gray-200';

  if (normalizeStatus === 'completed' || normalizeStatus === 'success') {
    variant = 'success'; // Custom variant if supported, else use default styling
    Icon = CheckCircle2;
    label = 'Completed';
    colorClass = 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200';
  } else if (normalizeStatus === 'processing' || normalizeStatus === 'uploading') {
    variant = 'default';
    Icon = Loader2;
    label = normalizeStatus === 'uploading' ? 'Uploading' : 'Processing';
    colorClass = 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200';
  } else if (normalizeStatus === 'failed' || normalizeStatus === 'error') {
    variant = 'destructive';
    Icon = XCircle;
    label = 'Failed';
    colorClass = 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200';
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn("gap-1.5 py-1 px-2.5 font-medium transition-colors cursor-help", colorClass, className)}
          >
            <Icon className={cn("w-3.5 h-3.5", normalizeStatus === 'processing' || normalizeStatus === 'uploading' ? 'animate-spin' : '')} />
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Status: {label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TranscriptionStatusBadge;
