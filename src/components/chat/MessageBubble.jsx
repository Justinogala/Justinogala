import React, { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, Smile, Pin, Edit2, CornerUpRight, ShieldAlert } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AttachmentRenderer from './AttachmentRenderer';
import MessageActionMenu from './MessageActionMenu';
import EmojiReactionPicker from './EmojiReactionPicker';
import EditMessageForm from './EditMessageForm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const MessageBubble = ({ 
  message, 
  isOwn, 
  showAvatar, 
  onAction 
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const attachments = message.attachments || [];
  const hasContent = message.content && message.content.trim().length > 0;
  
  // Handlers
  const handleAction = (action) => {
    if (action === 'edit') setIsEditing(true);
    else if (action === 'react') setShowEmojiPicker(!showEmojiPicker);
    else onAction(action, message);
  };

  const handleSaveEdit = (newContent) => {
    onAction('saveEdit', { ...message, content: newContent });
    setIsEditing(false);
  };

  const handleReaction = (emoji) => {
    onAction('addReaction', { message, emoji });
    setShowEmojiPicker(false);
  };

  // Group reactions for display
  const reactions = message.reactions || {};
  const hasReactions = Object.keys(reactions).length > 0;

  return (
    <div 
      className={cn(
        "group flex w-full animate-message-in mb-3 relative", 
        isOwn ? "justify-end" : "justify-start"
      )}
      id={`message-${message.id}`}
    >
      <div className={cn(
        "flex max-w-[85%] md:max-w-[70%] gap-3 relative",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar Area */}
        <div className="w-8 flex-shrink-0 flex flex-col justify-end pb-1">
          {!isOwn && showAvatar ? (
            <Avatar className="h-8 w-8 ring-2 ring-white dark:ring-slate-900 shadow-sm border-2 border-white dark:border-slate-800">
              <AvatarImage src={message.sender_avatar} />
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-bold">
                {message.sender_name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : <div className="w-8" />}
        </div>

        {/* Message Content Container */}
        <div className={cn(
          "flex flex-col gap-1 min-w-[200px]",
          isOwn ? "items-end" : "items-start"
        )}>
          {/* Metadata Row (Sender Name + Indicators) */}
          <div className="flex items-center gap-2 px-1">
            {!isOwn && showAvatar && (
              <span className="text-[10px] text-violet-600/80 dark:text-violet-400/80 font-bold">
                {message.sender_name}
              </span>
            )}
            {message.isPinned && (
              <div className="flex items-center text-[10px] text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1.5 rounded">
                <Pin className="w-3 h-3 mr-1" /> Pinned
              </div>
            )}
            {message.forwardedFrom && (
              <div className="flex items-center text-[10px] text-slate-400 italic">
                <CornerUpRight className="w-3 h-3 mr-1" /> Forwarded from {message.forwardedFrom}
              </div>
            )}
          </div>

          {/* Render Attachments */}
          {attachments.length > 0 && (
            <div className={cn(
              "flex flex-wrap gap-2 mb-1",
              isOwn ? "justify-end" : "justify-start"
            )}>
              {attachments.map((att, idx) => (
                <div key={att.id || idx} className="border-2 border-violet-100 dark:border-violet-900/30 rounded-lg overflow-hidden shadow-sm">
                   <AttachmentRenderer attachment={att} />
                </div>
              ))}
            </div>
          )}

          {/* Main Content Box */}
          <div className="relative group/bubble">
             {/* Action Menu Trigger (Visible on Hover) */}
            <div className={cn(
              "absolute top-0 flex items-center gap-1 z-10",
              isOwn ? "right-full mr-2" : "left-full ml-2"
            )}>
              <MessageActionMenu 
                isOwn={isOwn} 
                isPinned={message.isPinned}
                onAction={handleAction} 
              />
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              >
                <Smile className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Emoji Picker Popup */}
            {showEmojiPicker && (
              <div className={cn("absolute z-50", isOwn ? "right-full mr-2" : "left-full ml-2", "top-0")}>
                <EmojiReactionPicker 
                  onSelect={handleReaction} 
                  onClose={() => setShowEmojiPicker(false)} 
                />
              </div>
            )}

            {/* Text Content */}
            {hasContent && (
              isEditing ? (
                <EditMessageForm 
                  initialContent={message.content} 
                  onSave={handleSaveEdit}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <div className={cn(
                  "relative px-4 py-2.5 text-sm leading-relaxed break-words transition-all duration-200 border shadow-sm",
                  isOwn 
                    ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-2xl rounded-tr-sm border-transparent shadow-violet-500/20" 
                    : "bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border-violet-100 dark:border-violet-900/30 rounded-2xl rounded-tl-sm hover:border-violet-300 dark:hover:border-violet-700"
                )}>
                  {message.content}
                </div>
              )
            )}
          </div>

          {/* Reactions Row */}
          {hasReactions && (
             <div className="flex flex-wrap gap-1 px-1 mt-1">
               {Object.entries(reactions).map(([emoji, userIds]) => (
                 <button 
                   key={emoji}
                   onClick={() => handleReaction(emoji)}
                   className={cn(
                     "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
                     userIds.includes('current-user-id') // Ideally pass current user id prop to check
                       ? "bg-violet-100 border-violet-300 text-violet-700 dark:bg-violet-900/40 dark:border-violet-700 dark:text-violet-300"
                       : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                   )}
                 >
                   <span>{emoji}</span>
                   <span className="text-[10px] font-semibold">{userIds.length}</span>
                 </button>
               ))}
             </div>
          )}

          {/* Status Footer */}
          <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400">
            <span>{format(new Date(message.created_at), 'h:mm a')}</span>
            
            {message.isEdited && (
              <span className="flex items-center" title="Edited">
                <Edit2 className="w-2.5 h-2.5 mr-0.5" /> Edited
              </span>
            )}
            
            {isOwn && (
              <span className="flex items-center ml-1">
                {message.status === 'read' ? (
                  <CheckCheck className="w-3 h-3 text-violet-500" />
                ) : (
                  <Check className="w-3 h-3 text-violet-300/70" />
                )}
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default MessageBubble;