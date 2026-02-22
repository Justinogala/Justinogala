import React, { useState, useRef } from 'react';
import { Send, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ChatMessageInput = ({ onSend, disabled, placeholder = "Type a message..." }) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-b-2xl"
    >
      <Input
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-slate-50 dark:bg-slate-800 border-0 focus-visible:ring-1 focus-visible:ring-violet-500 rounded-full pl-4"
      />
      
      {disabled && placeholder.includes("API Key") ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button" 
                size="icon" 
                disabled
                className="rounded-full w-10 h-10 bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              >
                <Lock className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>API Key Configuration Required</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Button 
          type="submit" 
          size="icon" 
          disabled={!message.trim() || disabled}
          className={`rounded-full w-10 h-10 transition-all duration-200 ${
            message.trim() && !disabled 
              ? 'bg-violet-600 hover:bg-violet-700 shadow-md hover:shadow-lg' 
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
          }`}
        >
          <Send className="w-4 h-4 ml-0.5" />
        </Button>
      )}
    </form>
  );
};

export default ChatMessageInput;