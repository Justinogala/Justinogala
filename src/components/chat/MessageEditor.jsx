
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

const MessageEditor = ({ initialContent, onSave, onCancel }) => {
  const [content, setContent] = useState(initialContent);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave(content);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="w-full flex items-center gap-2 bg-gray-50 dark:bg-slate-800/50 p-2 rounded-lg border border-indigo-200 dark:border-indigo-900/50">
      <Input
        ref={inputRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 h-8 text-sm bg-white dark:bg-slate-900"
      />
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:bg-green-50 hover:text-green-600" onClick={() => onSave(content)}>
          <Check className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default MessageEditor;
