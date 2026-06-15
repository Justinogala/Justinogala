import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  Bot, Send, Sparkles, Code, FileText, Lightbulb,
  BrainCircuit, Paperclip, Mic, ImagePlus, Globe,
  MessageSquarePlus, Search, Pin, ChevronLeft, Menu,
  ArrowRight, Lock, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const suggestedPrompts = [
  { icon: Sparkles, label: 'Write a professional email', prompt: 'Help me write a professional email to a client about a project delay' },
  { icon: Code, label: 'Debug my code', prompt: 'I have a bug in my code. Can you help me debug it?' },
  { icon: FileText, label: 'Summarize meeting notes', prompt: 'Summarize the following meeting notes into key decisions and action items' },
  { icon: Lightbulb, label: 'Brainstorm ideas', prompt: 'Help me brainstorm 10 creative ideas for improving team productivity' },
  { icon: BrainCircuit, label: 'Explain a concept', prompt: 'Explain the concept of machine learning in simple terms' },
  { icon: FileText, label: 'Create a project plan', prompt: 'Create a detailed project plan for launching a new product feature' },
];

const demoConversations = [
  { id: 1, title: 'Marketing strategy brainstorm', pinned: true },
  { id: 2, title: 'Q4 report analysis' },
  { id: 3, title: 'Bug fix for auth module' },
  { id: 4, title: 'Weekly meeting summary' },
  { id: 5, title: 'Product roadmap planning' },
];

export default function FeatureAIChatPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const inputRef = useRef(null);

  const triggerSignup = () => setShowSignupModal(true);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      triggerSignup();
    }
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-slate-950" data-testid="ai-chat-preview-page">
      <Helmet><title>AI Chat - Munal AI</title></Helmet>

      {/* Sidebar */}
      <div className={cn(
        "flex-shrink-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col transition-all duration-300 h-full",
        sidebarOpen ? "w-72" : "w-0 overflow-hidden"
      )} data-testid="chat-sidebar-preview">
        <div className="p-3 border-b border-gray-100 dark:border-slate-800">
          <button
            onClick={triggerSignup}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
            data-testid="new-chat-btn-preview"
          >
            <MessageSquarePlus className="w-4 h-4" />
            New Chat
          </button>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              readOnly
              onFocus={triggerSignup}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none cursor-pointer"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {demoConversations.map(conv => (
            <div
              key={conv.id}
              onClick={triggerSignup}
              className="group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              {conv.pinned && <Pin className="w-3 h-3 text-violet-500 flex-shrink-0 rotate-45" />}
              <span className="flex-1 truncate">{conv.title}</span>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-gray-100 dark:border-slate-800 text-center">
          <span className="text-[10px] text-gray-400 dark:text-gray-600">Powered by GPT-5.2</span>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
          <a href="/" className="flex items-center gap-2 mr-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white hidden sm:inline">Munal</span>
          </a>
          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            {sidebarOpen ? <ChevronLeft className="w-5 h-5 text-gray-500" /> : <Menu className="w-5 h-5 text-gray-500" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Munal AI Assistant</h2>
              <p className="text-[10px] text-gray-400">GPT-5.2 · Always ready</p>
            </div>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => navigate('/signup')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors shadow-sm"
              data-testid="get-started-header-btn"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Empty State / Welcome */}
        <div className="flex-1 overflow-y-auto" data-testid="chat-preview-area">
          <div className="flex flex-col items-center justify-center h-full px-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
              <Bot className="w-9 h-9 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2" data-testid="preview-title">How can I help you today?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md">
              Ask me anything — from writing code and emails to brainstorming ideas and analyzing data.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl w-full">
              {suggestedPrompts.map((sp, i) => (
                <button
                  key={i}
                  onClick={triggerSignup}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md transition-all text-left group"
                  data-testid={`preview-prompt-${i}`}
                >
                  <sp.icon className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{sp.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-end gap-2">
            <button
              onClick={triggerSignup}
              className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
              title="Upload file"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <button
              onClick={triggerSignup}
              className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
              title="Voice input"
            >
              <Mic className="w-5 h-5" />
            </button>

            <button
              onClick={triggerSignup}
              className="p-2.5 rounded-xl text-gray-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors flex-shrink-0"
              title="Generate image"
            >
              <ImagePlus className="w-5 h-5" />
            </button>

            <button
              onClick={() => setWebSearchEnabled(prev => !prev)}
              className={cn(
                "p-2.5 rounded-xl transition-all flex-shrink-0 relative",
                webSearchEnabled
                  ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800"
              )}
              title={webSearchEnabled ? "Web search: ON" : "Web search: OFF"}
            >
              <Globe className="w-5 h-5" />
              {webSearchEnabled && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
              )}
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={triggerSignup}
                placeholder="Message Munal AI..."
                className="w-full resize-none rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-4 py-3 pr-12 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow min-h-[48px] max-h-[200px]"
                rows={1}
                data-testid="chat-input-preview"
              />
            </div>

            <button
              onClick={triggerSignup}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-gray-600 transition-colors flex-shrink-0 hover:bg-violet-600 hover:text-white"
              data-testid="send-btn-preview"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center mt-2">
            Munal AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>

      {/* Signup Modal */}
      <AnimatePresence>
        {showSignupModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSignupModal(false)}
          >
            <motion.div
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-md mx-4 p-8 text-center"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              data-testid="signup-modal"
            >
              <button
                onClick={() => setShowSignupModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-500/20">
                <Lock className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Create a free account to chat
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Sign up in seconds to unlock unlimited AI conversations, image generation, web search, file analysis, and more.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors shadow-sm"
                  data-testid="signup-modal-create-btn"
                >
                  <Sparkles className="w-5 h-5" />
                  Create Free Account
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-colors"
                  data-testid="signup-modal-login-btn"
                >
                  Already have an account? Log in
                </button>
              </div>

              <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-gray-400">
                <span className="flex items-center gap-1"><Bot className="w-3.5 h-3.5" /> GPT-5.2</span>
                <span className="flex items-center gap-1"><ImagePlus className="w-3.5 h-3.5" /> Image Gen</span>
                <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Web Search</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
