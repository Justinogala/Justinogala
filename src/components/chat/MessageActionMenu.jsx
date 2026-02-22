import React from 'react';
import { MoreVertical, Trash2, Edit2, Pin, PinOff, Copy, CornerUpRight, Smile, Flag, Archive } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";

const MessageActionMenu = ({ 
  isOwn, 
  isPinned, 
  onAction 
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full focus:opacity-100 outline-none">
          <MoreVertical className="w-4 h-4 text-slate-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isOwn ? "end" : "start"} className="w-48 bg-white dark:bg-slate-900">
        
        <DropdownMenuItem onClick={() => onAction('reply')}>
          <CornerUpRight className="w-4 h-4 mr-2" /> Reply
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => onAction('copy')}>
          <Copy className="w-4 h-4 mr-2" /> Copy Text
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onAction('forward')}>
          <CornerUpRight className="w-4 h-4 mr-2 transform rotate-90" /> Forward
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onAction('pin')}>
          {isPinned ? <PinOff className="w-4 h-4 mr-2" /> : <Pin className="w-4 h-4 mr-2" />}
          {isPinned ? 'Unpin' : 'Pin'}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {isOwn ? (
          <>
            <DropdownMenuItem onClick={() => onAction('edit')}>
              <Edit2 className="w-4 h-4 mr-2" /> Edit Message
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('delete')} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={() => onAction('report')} className="text-orange-600 focus:text-orange-600 focus:bg-orange-50 dark:focus:bg-orange-900/20">
            <Flag className="w-4 h-4 mr-2" /> Report
          </DropdownMenuItem>
        )}
        
        {isOwn && (
          <DropdownMenuItem onClick={() => onAction('archive')} className="text-slate-500">
            <Archive className="w-4 h-4 mr-2" /> Archive
          </DropdownMenuItem>
        )}

      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MessageActionMenu;