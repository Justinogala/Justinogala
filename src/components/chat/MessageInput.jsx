import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';

const MessageInput = ({ onSend, onTyping, isSending }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !isSending) {
      onSend(text);
      setText('');
      // Stop typing indicator immediately
      onTyping(false);
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    onTyping(true);
    
    // Debounce typing stop
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 items-center"
    >
      <Input
        value={text}
        onChange={handleChange}
        placeholder="Type a message..."
        className="flex-1 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-violet-500"
        disabled={isSending}
      />
      <Button 
        type="submit" 
        size="icon" 
        disabled={!text.trim() || isSending}
        className="bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 rounded-xl transition-all"
      >
        {isSending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4 ml-0.5" />
        )}
      </Button>
    </form>
  );
};

export default MessageInput;