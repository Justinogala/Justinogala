
import React, { useState, useEffect } from 'react';
import { Disc, Square, Pause, Play, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MeetingRecorder = ({ isRecording, onStartRecording, onStopRecording }) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [filename, setFilename] = useState(`Meeting-Recording-${new Date().toISOString().slice(0,10)}`);
  
  useEffect(() => {
    let interval;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60).toString().padStart(2, '0');
    const seconds = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${seconds}`;
  };

  const handleStop = () => {
    onStopRecording(); // Stop logic in parent
    setShowSaveDialog(true);
  };

  const handleSave = () => {
    // Logic to save recording metadata
    setShowSaveDialog(false);
    setDuration(0);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {!isRecording ? (
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-12 w-12 bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
            onClick={onStartRecording}
            title="Start Recording"
          >
            <Disc className="h-5 w-5" />
          </Button>
        ) : (
          <div className="flex items-center gap-2 bg-slate-800 rounded-full pl-4 pr-1 py-1 border border-slate-700">
            <div className="flex items-center gap-2 mr-2">
              <div className={`w-2.5 h-2.5 rounded-full bg-red-500 ${!isPaused ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-mono text-white w-12">{formatDuration(duration)}</span>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-white hover:bg-slate-700"
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            </Button>
            
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleStop}
              title="Stop Recording"
            >
              <Square className="h-3 w-3 fill-current" />
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Recording</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filename">Filename</Label>
              <Input 
                id="filename" 
                value={filename} 
                onChange={(e) => setFilename(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Quality</Label>
              <Select defaultValue="hd">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hd">High Definition (1080p)</SelectItem>
                  <SelectItem value="sd">Standard (720p)</SelectItem>
                  <SelectItem value="low">Low Bandwidth (480p)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-slate-500">
              Recording duration: {formatDuration(duration)}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Discard</Button>
            <Button onClick={handleSave} className="bg-violet-600 text-white">
              <Save className="w-4 h-4 mr-2" /> Save to Cloud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MeetingRecorder;
