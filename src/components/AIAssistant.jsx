import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Minus, Send, Bot, User, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { findResponse } from '@/data/aiResponses';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, type: 'ai', text: "Hi there! 👋 I'm your EchoNote AI assistant. How can I help you today?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { theme } = useTheme();

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: userMessage }]);
    setIsTyping(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const responseText = findResponse(userMessage);
      
      setMessages(prev => {
        const newMessages = [...prev, { id: Date.now() + 1, type: 'ai', text: responseText }];
        // Limit history to last 50 messages
        return newMessages.slice(-50);
      });
      setIsTyping(false);
    }, 800 + Math.random() * 500); // Random delay between 800-1300ms
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const toggleMinimize = (e) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      setIsOpen(true);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000] font-sans flex flex-col items-end pointer-events-none">
      <AnimatePresence mode="wait">
        {isOpen && !isMinimized ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "pointer-events-auto w-[90vw] h-[70vh] sm:w-[350px] sm:h-[450px] lg:w-[380px] lg:h-[500px]",
              "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col"
            )}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 text-white">
                <div className="bg-white/20 p-2 rounded-full">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">EchoNote AI</h3>
                  <p className="text-[10px] text-indigo-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleMinimize}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                  aria-label="Minimize chat"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-950/50 scroll-smooth"
              role="log"
              aria-live="polite"
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex w-full",
                    msg.type === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm relative group",
                    msg.type === 'user' 
                      ? "bg-blue-600 text-white rounded-tr-sm" 
                      : "bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-slate-700 rounded-tl-sm"
                  )}>
                    {msg.type === 'ai' && (
                       <Bot className="w-4 h-4 absolute -left-6 top-1 text-gray-400 opacity-50" />
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start w-full"
                >
                  <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 shrink-0">
              <form 
                onSubmit={handleSendMessage}
                className="flex items-center gap-2"
              >
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 h-10 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 focus-visible:ring-indigo-500 rounded-full px-4"
                  disabled={isTyping}
                />
                <Button 
                  type="submit" 
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-full shrink-0 transition-all duration-200",
                    !inputValue.trim() || isTyping 
                      ? "bg-gray-200 dark:bg-slate-800 text-gray-400 cursor-not-allowed" 
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:scale-105 active:scale-95"
                  )}
                  disabled={!inputValue.trim() || isTyping}
                  aria-label="Send message"
                >
                  {isTyping ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 ml-0.5" />
                  )}
                </Button>
              </form>
              <div className="text-center mt-2">
                 <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    AI responses may vary. Check our docs for verified info.
                 </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: -180 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleOpen}
            className="pointer-events-auto w-[60px] h-[60px] rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl flex items-center justify-center relative group"
            aria-label="Open AI Assistant"
          >
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-20" />
            <MessageCircle className="w-7 h-7 fill-white/20" />
            <div className="absolute bottom-3 right-3 bg-yellow-400 text-slate-900 rounded-full p-0.5">
               <Sparkles className="w-3 h-3" />
            </div>
            
            {/* Tooltip */}
            <span className="absolute right-full mr-4 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Chat with EchoNote AI
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIAssistant;