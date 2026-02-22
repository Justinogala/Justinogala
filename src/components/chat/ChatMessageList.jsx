import React, { useRef, useEffect } from 'react';
import { Bot, User } from 'lucide-react';
import { format } from 'date-fns';
import TypingIndicator from './TypingIndicator';
import { cn } from '@/lib/utils';

const ChatMessageList = ({ messages, isTyping }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div 
      ref={scrollRef} 
      className="flex-1 overflow-y-auto p-4 space-y-4 munal-scrollbar bg-slate-50/50 dark:bg-slate-950/50"
    >
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-6">
          <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Hi, I'm Munal AI! 👋</h3>
          <p className="text-sm">Ask me anything about your workspace, meetings, or features.</p>
        </div>
      )}

      {messages.map((msg, idx) => {
        const isAi = msg.role === 'assistant';
        return (
          <div 
            key={idx} 
            className={cn(
              "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
              isAi ? "justify-start" : "justify-end"
            )}
          >
            <div className={cn(
              "flex max-w-[85%] gap-2",
              isAi ? "flex-row" : "flex-row-reverse"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm",
                isAi 
                  ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white" 
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              )}>
                {isAi ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>

              <div className="flex flex-col gap-1">
                <div className={cn(
                  "px-4 py-2.5 shadow-sm text-sm leading-relaxed whitespace-pre-wrap",
                  isAi 
                    ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl munal-message-bubble-ai border border-slate-100 dark:border-slate-700" 
                    : "bg-violet-600 text-white rounded-2xl munal-message-bubble-user shadow-violet-500/20"
                )}>
                  {msg.content}
                </div>
                <span className={cn(
                  "text-[10px] text-slate-400 px-1",
                  isAi ? "text-left" : "text-right"
                )}>
                  {format(new Date(msg.timestamp || Date.now()), 'h:mm a')}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {isTyping && (
        <div className="flex w-full justify-start animate-in fade-in">
          <div className="flex max-w-[85%] gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <TypingIndicator />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessageList;