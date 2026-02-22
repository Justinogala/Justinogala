
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Trash2, Copy, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import '@/styles/voiceChat.css';

const VoiceControlPanel = ({
  isRecording,
  onStart,
  onStop,
  onClear,
  onSave,
  onDownload,
  onCopy,
  hasContent,
  isSaving
}) => {
  const { toast } = useToast();

  const handleCopy = () => {
    onCopy();
    toast({
      title: "Copied!",
      description: "Transcript copied to clipboard.",
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Primary Controls */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-center">
          {!isRecording ? (
            <Button 
              onClick={onStart} 
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px] shadow-lg hover:shadow-indigo-500/20 hover-scale-sm"
            >
              <Play className="w-5 h-5 mr-2 fill-current" />
              Start Rec
            </Button>
          ) : (
            <Button 
              onClick={onStop} 
              size="lg"
              variant="destructive"
              className="min-w-[140px] shadow-lg hover:shadow-red-500/20 hover-scale-sm"
            >
              <Square className="w-5 h-5 mr-2 fill-current" />
              Stop
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            disabled={isRecording || !hasContent}
            className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
            title="Clear Transcript"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!hasContent}
            className="gap-2"
          >
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">Copy</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            disabled={!hasContent}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Text</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onSave}
            disabled={!hasContent || isRecording || isSaving}
            className="gap-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 min-w-[100px]"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoiceControlPanel;
