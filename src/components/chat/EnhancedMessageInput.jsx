import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Smile, MoreHorizontal, MapPin, Users, BarChart3, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import all chat feature components
import EmojiPicker from './EmojiPicker';
import FileUploadHandler from './FileUploadHandler';
import ImageUploadHandler from './ImageUploadHandler';
import VoiceMessageRecorder from './VoiceMessageRecorder';
import LocationPicker from './LocationPicker';
import PollCreator from './PollCreator';
import ContactSharePicker from './ContactSharePicker';
import ScheduleMessagePicker from './ScheduleMessagePicker';

const EnhancedMessageInput = ({ onSendMessage, disabled, placeholder = "Type a message...", onTyping }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  
  const textareaRef = useRef(null);
  const emojiTriggerRef = useRef(null);

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiTriggerRef.current && !emojiTriggerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message, attachments);
      setMessage('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
    setMessage(target.value);
    
    // Trigger typing indicator
    if (target.value.trim()) {
      onTyping?.(true);
    }
  };

  const insertEmoji = (emoji) => {
    setMessage(prev => prev + emoji);
    textareaRef.current?.focus();
    onTyping?.(true);
  };

  const handleAttachment = (attachment) => {
    if (attachment.url || attachment.type) {
      setAttachments(prev => [...prev, attachment]);
    }
  };

  const handlePollCreate = (poll) => {
    setAttachments(prev => [...prev, poll]);
  };

  const handleContactShare = (contact) => {
    setAttachments(prev => [...prev, contact]);
  };

  const handleScheduleMessage = (scheduled) => {
    // In a real app, this would save to backend
    console.log('Scheduled message:', scheduled);
    onSendMessage(`[Scheduled for ${new Date(scheduled.scheduledFor).toLocaleString()}] ${scheduled.message}`, []);
    setMessage('');
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getAttachmentIcon = (type) => {
    switch (type) {
      case 'image': return '🖼️';
      case 'file': return '📎';
      case 'location': return '📍';
      case 'voice': return '🎤';
      case 'poll': return '📊';
      case 'contact': return '👤';
      default: return '📄';
    }
  };

  const hasContent = message.trim() || attachments.length > 0;

  return (
    <div className="p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-slate-800 relative z-20">
      
      {/* Attachments Preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-2 mb-3 overflow-x-auto py-1 scrollbar-hide"
          >
            {attachments.map((att, i) => (
              <motion.div 
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative group bg-gray-50 dark:bg-slate-800 rounded-xl p-2 border border-gray-200 dark:border-slate-700 flex items-center gap-2 min-w-[140px] max-w-[200px] shadow-sm"
              >
                {att.type === 'image' ? (
                  <img src={att.url} alt="attachment" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center text-lg">
                    {getAttachmentIcon(att.type)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-gray-700 dark:text-gray-300">
                    {att.name || att.question || 'Attachment'}
                  </p>
                  <p className="text-[10px] text-gray-400 capitalize">{att.type}</p>
                </div>
                <button 
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                >
                  <span className="text-xs">×</span>
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
        
        {/* Left Side Actions - Primary */}
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-0.5 pb-2">
            {/* File Upload */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div><FileUploadHandler onUploadComplete={handleAttachment} /></div>
              </TooltipTrigger>
              <TooltipContent side="top"><p>Attach file</p></TooltipContent>
            </Tooltip>

            {/* Image Upload */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div><ImageUploadHandler onUploadComplete={handleAttachment} /></div>
              </TooltipTrigger>
              <TooltipContent side="top"><p>Upload image</p></TooltipContent>
            </Tooltip>

            {/* More Options Dropdown */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-500 hover:text-indigo-600 rounded-full h-9 w-9"
                      data-testid="chat-more-options-btn"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="top"><p>More options</p></TooltipContent>
              </Tooltip>
              <DropdownMenuContent side="top" align="start" className="w-56 p-2">
                <DropdownMenuLabel className="text-xs text-gray-500 px-2">Share</DropdownMenuLabel>
                <div className="space-y-1">
                  <LocationPicker onSendLocation={(loc) => handleAttachment({ type: 'location', ...loc, name: 'Current Location' })} />
                  <ContactSharePicker onShareContact={handleContactShare} />
                </div>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuLabel className="text-xs text-gray-500 px-2">Create</DropdownMenuLabel>
                <div className="space-y-1">
                  <PollCreator onCreatePoll={handlePollCreate} />
                </div>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuLabel className="text-xs text-gray-500 px-2">Schedule</DropdownMenuLabel>
                <div className="space-y-1">
                  <ScheduleMessagePicker message={message} onSchedule={handleScheduleMessage} />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipProvider>

        {/* Input Field */}
        <div className={cn(
          "flex-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-2xl border-2 transition-all duration-200",
          isFocused 
            ? "border-indigo-500/50 bg-white dark:bg-slate-900 ring-4 ring-indigo-500/10" 
            : "border-transparent"
        )}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            placeholder={attachments.length > 0 ? "Add a caption..." : placeholder}
            className="w-full px-4 py-3 bg-transparent border-none focus:ring-0 resize-none max-h-[120px] text-sm text-gray-900 dark:text-white placeholder:text-gray-500 scrollbar-hide"
            data-testid="message-input"
          />
        </div>

        {/* Right Side Actions */}
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-0.5 pb-2">
            {/* Emoji Picker */}
            <div className="relative hidden sm:block" ref={emojiTriggerRef}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                    className={cn(
                      "rounded-full h-9 w-9 transition-colors",
                      showEmojiPicker ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20" : "text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                    )}
                  >
                    <Smile className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top"><p>Emojis</p></TooltipContent>
              </Tooltip>
              <EmojiPicker 
                isOpen={showEmojiPicker} 
                onClose={() => setShowEmojiPicker(false)}
                onSelect={insertEmoji}
              />
            </div>
            
            {/* Send / Voice */}
            {hasContent ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      type="submit" 
                      disabled={disabled}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full h-10 w-10 p-0 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
                      data-testid="send-message-btn"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top"><p>Send message</p></TooltipContent>
                </Tooltip>
              </motion.div>
            ) : (
              <VoiceMessageRecorder 
                onSend={(file, duration) => handleAttachment({ type: 'voice', file, duration, name: 'Voice Message' })} 
              />
            )}
          </div>
        </TooltipProvider>
      </form>
      
      {/* Formatting Hint */}
      <div className="flex justify-between mt-2 px-1">
        <span className="text-[10px] text-gray-400 hidden sm:inline">
          Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-slate-800 rounded text-[9px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-slate-800 rounded text-[9px]">Shift+Enter</kbd> for new line
        </span>
        <span className="text-[10px] text-gray-400 hidden sm:inline">
          **bold** • *italic* • `code`
        </span>
      </div>
    </div>
  );
};

export default EnhancedMessageInput;
