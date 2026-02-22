
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { MoreVertical, BellOff, Pin, Trash2, Ban, Flag, Download, Settings } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ChatMenuOptions = ({ onClearChat, onExportChat }) => {
  const { toast } = useToast();

  const handleAction = (action) => {
    toast({
      title: "Action Triggered",
      description: `${action} functionality is mocked for this demo.`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Conversation Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => handleAction('Mute Notifications')}>
          <BellOff className="w-4 h-4 mr-2" />
          Mute Notifications
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleAction('Pin Conversation')}>
          <Pin className="w-4 h-4 mr-2" />
          Pin Conversation
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onExportChat}>
          <Download className="w-4 h-4 mr-2" />
          Export Chat
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleAction('Settings')}>
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onClearChat} className="text-red-600 focus:text-red-600">
          <Trash2 className="w-4 h-4 mr-2" />
          Clear History
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleAction('Block User')} className="text-red-600 focus:text-red-600">
          <Ban className="w-4 h-4 mr-2" />
          Block Member
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleAction('Report')} className="text-red-600 focus:text-red-600">
          <Flag className="w-4 h-4 mr-2" />
          Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChatMenuOptions;
