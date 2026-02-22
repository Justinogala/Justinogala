
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Bot, User, Trash2, Loader2 } from 'lucide-react';
import { answerQuestion } from '@/services/chatService';
import { cn } from '@/lib/utils';

const ChatPanel = ({ apiKey }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I can answer questions about this meeting. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const answer = await answerQuestion(userMessage, messages, apiKey);
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't process that request. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-400" />
          <CardTitle>Meeting Assistant</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMessages([])}>
          <Trash2 className="w-4 h-4 text-gray-500" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                msg.role === 'user' ? "bg-indigo-600" : "bg-slate-700"
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-indigo-300" />}
              </div>
              <div className={cn(
                "max-w-[80%] rounded-lg p-3 text-sm",
                msg.role === 'user' ? "bg-indigo-600 text-white" : "bg-slate-800 text-gray-200 border border-white/5"
              )}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-indigo-300" />
              </div>
              <div className="bg-slate-800 rounded-lg p-3 border border-white/5 flex items-center">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin mr-2" />
                <span className="text-sm text-gray-400">Thinking...</span>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-slate-900/50 border-t border-white/10">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about the meeting..."
              className="flex-1 bg-slate-950 border-white/10"
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatPanel;
