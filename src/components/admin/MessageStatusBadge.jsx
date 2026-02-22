
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Mail, MailOpen, Archive, Flag } from 'lucide-react';

const MessageStatusBadge = ({ status, isFlagged }) => {
  
  const getStatusConfig = () => {
    if (status === 'archived') {
      return {
        variant: 'secondary',
        icon: Archive,
        label: 'Archived',
        className: 'bg-gray-100 text-gray-600 border-gray-200'
      };
    }
    if (status === 'read') {
      return {
        variant: 'success',
        icon: MailOpen,
        label: 'Read',
        className: 'bg-green-100 text-green-700 border-green-200'
      };
    }
    return {
      variant: 'default',
      icon: Mail,
      label: 'Unread',
      className: 'bg-blue-100 text-blue-700 border-blue-200'
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="flex gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
             <Badge variant={config.variant} className={`flex items-center gap-1.5 ${config.className}`}>
               <Icon className="w-3 h-3" />
               {config.label}
             </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Message is {config.label.toLowerCase()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isFlagged && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="warning" className="bg-yellow-100 text-yellow-700 border-yellow-200 flex items-center gap-1.5">
                <Flag className="w-3 h-3 fill-yellow-700" />
                Flagged
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Marked as important</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default MessageStatusBadge;
