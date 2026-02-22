
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, X, Loader2 } from 'lucide-react';

const AdminMessageReplyForm = ({ onSend, onCancel }) => {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setSending(true);
    try {
      await onSend(content);
      setContent('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-gray-800 animate-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Compose Reply</h4>
        <Button variant="ghost" size="sm" onClick={onCancel} className="h-6 w-6 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Textarea 
          placeholder="Type your response here..."
          className="min-h-[120px] bg-white dark:bg-slate-950 resize-none focus:ring-violet-500 mb-2"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoFocus
        />
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {content.length} characters
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={sending}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="sm" 
              disabled={!content.trim() || sending}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {sending ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-3 h-3 mr-2" />
                  Send Reply
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminMessageReplyForm;
