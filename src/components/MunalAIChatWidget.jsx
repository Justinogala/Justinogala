import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Minimize2, Sparkles, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatMessageList from '@/components/chat/ChatMessageList';
import ChatMessageInput from '@/components/chat/ChatMessageInput';
import { Link } from 'react-router-dom';
import '@/styles/munalAIChat.css';

const MunalAIChatWidget = ({
  isOpen,
  isMinimized,
  messages,
  isTyping,
  isConfigured = true,
  isLoadingConfig = false,
  onToggleOpen,
  onToggleMinimize,
  onSendMessage,
  onClose
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none flex flex-col items-end gap-4">
      <AnimatePresence mode="wait">
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="pointer-events-auto w-[90vw] sm:w-[380px] h-[600px] max-h-[80vh] flex flex-col rounded-2xl shadow-2xl munal-ai-glass border border-white/20 dark:border-white/10 overflow-hidden ring-1 ring-black/5"
          >
            {/* Header */}
            <div className="munal-ai-gradient p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Munal AI</h3>
                  <p className="text-violet-100 text-xs flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-red-400'}`} />
                    {isConfigured ? 'Online' : 'Configuration Needed'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={onToggleMinimize}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Minimize"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
              {!isConfigured && !isLoadingConfig ? (
                <div className="absolute inset-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">API Key Missing</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                    Please configure your OpenAI API key in settings to start chatting with Munal AI.
                  </p>
                  <Link to="/settings/api-keys">
                    <Button className="gap-2 bg-violet-600 hover:bg-violet-700">
                      <Settings className="w-4 h-4" />
                      Configure Settings
                    </Button>
                  </Link>
                </div>
              ) : null}
              
              <ChatMessageList messages={messages} isTyping={isTyping} />
            </div>

            {/* Input Area */}
            <div className="shrink-0">
               <ChatMessageInput 
                 onSend={onSendMessage} 
                 disabled={isTyping || !isConfigured} 
                 placeholder={!isConfigured ? "API Key required..." : "Type a message..."}
               />
            </div>
            
            {/* Footer / Attribution */}
            <div className="bg-white dark:bg-slate-900 text-center py-1 text-[10px] text-slate-400 border-t border-slate-50 dark:border-slate-800">
              Powered by EchoNote Intelligence
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      {(!isOpen || isMinimized) && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleOpen}
          className="pointer-events-auto munal-ai-gradient w-14 h-14 rounded-full shadow-lg shadow-violet-600/30 flex items-center justify-center relative group"
        >
          <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-20" />
          <MessageCircle className="w-7 h-7 text-white fill-current" />
          
          {/* Notification Badge if minimized and has unread messages (mock logic) */}
          {isMinimized && messages.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              !
            </span>
          )}
        </motion.button>
      )}
    </div>
  );
};

export default MunalAIChatWidget;