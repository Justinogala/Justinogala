
import React, { useState, useEffect } from 'react';
import { Save, Edit2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const MeetingNotes = ({ notes, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentNotes, setCurrentNotes] = useState(notes || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCurrentNotes(notes || '');
  }, [notes]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(currentNotes);
    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <Card className="h-full flex flex-col border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Meeting Notes</CardTitle>
        {!isEditing ? (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 min-h-[300px]">
        {isEditing ? (
          <div className="h-full flex flex-col gap-2">
            <Textarea
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              placeholder="Type your meeting notes here..."
              className="flex-1 resize-none p-4 text-base leading-relaxed"
            />
            <div className="text-xs text-right text-slate-400">
              {currentNotes.length} characters
            </div>
          </div>
        ) : (
          <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {currentNotes || (
              <span className="text-slate-400 italic">No notes available for this meeting.</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MeetingNotes;
