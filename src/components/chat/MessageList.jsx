import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Check, CheckCheck } from 'lucide-react';
import TypingIndicator from './TypingIndicator';

const MessageList = ({ messages = [], currentUserId, users = [], isTyping }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const getUser = (id) => {
    if (!users || !Array.isArray(users)) return { initials: '??', avatarColor: 'bg-slate-400' };
    return users.find(u => u.id === id) || { initials: '??', avatarColor: 'bg-slate-400' };
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-3xl">
            👋
          </div>
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Say hello to start the conversation!</p>
        </div>
      ) : (
        messages.map((msg, index) => {
          const isOwn = msg.senderId === currentUserId;
          const sender = getUser(msg.senderId);
          const showAvatar = !isOwn && (index === 0 || messages[index - 1].senderId !== msg.senderId);
          
          return (
            <div 
              key={msg.id} 
              className={cn(
                "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
                isOwn ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn("flex max-w-[70%] gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
                {/* Avatar Column */}
                <div className="w-8 flex-shrink-0 flex flex-col justify-end">
                  {!isOwn && showAvatar && (
                    <Avatar className="h-8 w-8 shadow-sm">
                      <AvatarFallback className={`${sender.avatarColor || 'bg-slate-400'} text-white text-[10px]`}>
                        {sender.initials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>

                {/* Bubble Column */}
                <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm shadow-sm break-words relative group",
                    isOwn 
                      ? "bg-violet-600 text-white rounded-tr-sm" 
                      : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-sm border border-slate-100 dark:border-slate-700"
                  )}>
                    {msg.content}
                  </div>
                  
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-[10px] text-slate-400">
                      {msg.timestamp ? format(new Date(msg.timestamp), 'h:mm a') : 'Just now'}
                    </span>
                    {isOwn && (
                      <span className="text-violet-600/60 dark:text-violet-400/60">
                        {msg.isRead ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {isTyping && (
        <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
          <div className="flex max-w-[70%] gap-2">
            <div className="w-8" /> {/* Spacer for avatar alignment */}
            <TypingIndicator />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;