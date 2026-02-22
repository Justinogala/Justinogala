import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Smile, MoreVertical, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

// Import custom components
import EmojiPicker from './EmojiPicker';
import GifPicker from './GifPicker';
import FileUploadHandler from './FileUploadHandler';
import ImageUploadHandler from './ImageUploadHandler';
import VoiceMessageRecorder from './VoiceMessageRecorder';
import LocationPicker from './LocationPicker';
import PollCreator from './PollCreator';
import ContactSharePicker from './ContactSharePicker';

const MessageInputArea = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  
  const textareaRef = useRef(null);
  const emojiTriggerRef = useRef(null);
  const gifTriggerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiTriggerRef.current && !emojiTriggerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
      if (gifTriggerRef.current && !gifTriggerRef.current.contains(event.target)) {
        setShowGifPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (message.trim() || attachments.length > 0) {
      // Send message WITH attachments
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
  };

  const insertEmoji = (emoji) => {
    setMessage(prev => prev + emoji);
  };

  const handleGifSelect = (gif) => {
    setAttachments(prev => [...prev, { 
      type: 'gif', 
      url: gif.url, 
      name: `GIF: ${gif.title}`
    }]);
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

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 glass-panel border-t border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg relative z-20">
      
      {/* Attachments Preview Area */}
      {attachments.length > 0 && (
         <div className="flex gap-2 mb-3 overflow-x-auto py-1">
            {attachments.map((att, i) => (
              <div key={i} className="relative group bg-gray-100 dark:bg-slate-800 rounded-lg p-1.5 border border-gray-200 dark:border-slate-700 flex items-center gap-2 min-w-[120px] max-w-[200px]">
                {att.type === 'image' || att.type === 'gif' ? (
                  <img src={att.url} alt="attachment" className="w-8 h-8 rounded object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600">
                    {att.type === 'location' ? '📍' : att.type === 'poll' ? '📊' : att.type === 'contact' ? '👤' : att.type === 'voice' ? '🎤' : '📎'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{att.name || att.question || 'Attachment'}</p>
                </div>
                <button 
                  onClick={() => removeAttachment(i)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                >
                  <span className="sr-only">Remove</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            ))}
         </div>
      )}

      <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
        
        {/* Left Side Actions */}
        <div className="flex items-center gap-1 pb-2">
          <FileUploadHandler onUploadComplete={handleAttachment} />
          <ImageUploadHandler onUploadComplete={handleAttachment} />
          <div className="hidden sm:block">
            <LocationPicker onSendLocation={(loc) => handleAttachment({ type: 'location', ...loc, name: 'Current Location' })} />
          </div>
          
          {/* More Options Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-500 rounded-full hover:text-indigo-600">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-48">
              <DropdownMenuLabel className="text-xs text-gray-500">Share</DropdownMenuLabel>
              <DropdownMenuItem asChild className="sm:hidden">
                <div className="w-full cursor-pointer flex items-center" onClick={(e) => e.stopPropagation()}>
                  <LocationPicker onSendLocation={(loc) => handleAttachment({ type: 'location', ...loc, name: 'Current Location' })} />
                  <span className="ml-2">Location</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <div className="w-full cursor-pointer flex items-center" onClick={(e) => e.stopPropagation()}>
                  <ContactSharePicker onShareContact={handleContactShare} />
                  <span className="ml-2">Contact</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-gray-500">Create</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <div className="w-full cursor-pointer flex items-center" onClick={(e) => e.stopPropagation()}>
                  <PollCreator onCreatePoll={handlePollCreate} />
                  <span className="ml-2">Poll</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Input Field */}
        <div className="flex-1 bg-gray-100/50 dark:bg-slate-800/50 rounded-2xl border border-transparent focus-within:border-indigo-500/50 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all duration-200">
          <textarea
            ref={textareaRef}
            rows={1}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={attachments.length > 0 ? "Add a caption..." : "Type a message..."}
            className="w-full px-4 py-3 bg-transparent border-none focus:ring-0 resize-none max-h-[120px] text-sm text-gray-900 dark:text-white placeholder:text-gray-500 scrollbar-hide"
            data-testid="chat-message-input"
          />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1 pb-2">
          {/* GIF Picker */}
          <div className="relative hidden sm:block" ref={gifTriggerRef}>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setShowGifPicker(!showGifPicker);
                setShowEmojiPicker(false);
              }}
              className={cn(
                "rounded-full transition-colors",
                showGifPicker ? "text-purple-500 bg-purple-50 dark:bg-purple-900/20" : "text-gray-500 hover:text-purple-500 hover:bg-purple-50"
              )}
            >
              <Sparkles className="w-5 h-5" />
            </Button>
            <GifPicker 
              isOpen={showGifPicker} 
              onClose={() => setShowGifPicker(false)}
              onSelect={handleGifSelect}
            />
          </div>

          {/* Emoji Picker */}
          <div className="relative" ref={emojiTriggerRef}>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowGifPicker(false);
              }}
              className={cn(
                "hidden sm:flex rounded-full transition-colors",
                showEmojiPicker ? "text-yellow-500 bg-yellow-50" : "text-gray-500 hover:text-yellow-500 hover:bg-yellow-50"
              )}
            >
              <Smile className="w-5 h-5" />
            </Button>
            <EmojiPicker 
              isOpen={showEmojiPicker} 
              onClose={() => setShowEmojiPicker(false)}
              onSelect={insertEmoji}
            />
          </div>
          
          {(message.trim() || attachments.length > 0) ? (
            <Button 
              type="submit" 
              disabled={disabled}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full h-10 w-10 p-0 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
              data-testid="send-btn"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </Button>
          ) : (
             <VoiceMessageRecorder 
               onSend={(file, duration) => handleAttachment({ type: 'voice', file, duration, name: 'Voice Message' })} 
             />
          )}
        </div>
      </form>
      
      <div className="flex justify-between mt-2 px-1">
        <span className="text-[10px] text-gray-400 hidden sm:inline">
          Press Enter to send • Shift+Enter for new line
        </span>
        <span className="text-[10px] text-gray-400 hidden sm:inline">
          **Bold**, *Italic*, `Code`
        </span>
      </div>
    </div>
  );
};

export default MessageInputArea;