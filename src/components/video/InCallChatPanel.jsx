
import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, X, Search, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const InCallChatPanel = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'System', text: 'Welcome to the meeting!', time: '10:00 AM', type: 'system' },
    { id: 2, sender: 'Sarah Chen', text: 'Hi everyone, can you hear me?', time: '10:02 AM', avatar: 'SC' },
    { id: 3, sender: 'Mike Ross', text: 'Yes, loud and clear!', time: '10:03 AM', avatar: 'MR' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setMessages([...messages, {
      id: Date.now(),
      sender: 'You',
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: 'ME'
    }]);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-sm shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
        <h3 className="font-semibold text-slate-900 dark:text-white">Meeting Chat</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === 'You' ? 'flex-row-reverse' : ''}`}>
              {msg.type !== 'system' && (
                <Avatar className="w-8 h-8 border border-slate-200 dark:border-slate-700">
                  <AvatarFallback className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {msg.avatar}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                {msg.type !== 'system' && (
                  <span className="text-[10px] text-slate-500 mb-1 ml-1">{msg.sender} • {msg.time}</span>
                )}
                
                {msg.type === 'system' ? (
                  <div className="w-full text-center my-2">
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-full">
                      {msg.text}
                    </span>
                  </div>
                ) : (
                  <div className={`px-3 py-2 rounded-lg text-sm ${
                    msg.sender === 'You' 
                      ? 'bg-violet-600 text-white rounded-br-none' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form onSubmit={handleSend} className="relative">
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..." 
            className="pr-20 bg-slate-50 dark:bg-slate-800 border-0 focus-visible:ring-1 focus-visible:ring-violet-500"
          />
          <div className="absolute right-1 top-1 flex gap-1">
             <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
               <Smile className="w-4 h-4" />
             </Button>
             <Button type="submit" size="icon" className="h-8 w-8 bg-violet-600 hover:bg-violet-700 text-white rounded-md">
               <Send className="w-3.5 h-3.5" />
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InCallChatPanel;
