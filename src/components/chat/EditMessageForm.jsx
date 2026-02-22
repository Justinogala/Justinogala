import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const EditMessageForm = ({ initialContent, onSave, onCancel }) => {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || content === initialContent) {
      onCancel();
      return;
    }
    
    setIsSubmitting(true);
    await onSave(content);
    setIsSubmitting(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[60px] resize-none bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-violet-500 mb-2"
        autoFocus
      />
      <div className="flex justify-between items-center text-xs text-slate-400">
        <span>Enter to save • Esc to cancel</span>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onCancel}
            className="h-7 px-2"
          >
            <X className="w-3 h-3 mr-1" /> Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSubmit} 
            disabled={!content.trim() || isSubmitting}
            className="h-7 px-2 bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Check className="w-3 h-3 mr-1" /> Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditMessageForm;