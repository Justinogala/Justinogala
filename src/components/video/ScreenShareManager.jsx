
import React, { useState } from 'react';
import { MonitorUp, MonitorOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const ScreenShareManager = ({ isSharing, onStartShare, onStopShare }) => {
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleStartShare = async () => {
    try {
      // In a real app, this would be navigator.mediaDevices.getDisplayMedia()
      // For this demo, we just trigger the state change
      await onStartShare();
      toast({
        title: "Screen Sharing Started",
        description: "You are now sharing your screen with participants.",
        className: "bg-emerald-50 border-emerald-200 text-emerald-800"
      });
    } catch (error) {
      toast({
        title: "Screen Share Failed",
        description: "Could not access screen sharing permissions.",
        variant: "destructive"
      });
    }
  };

  const handleStopShareClick = () => {
    setShowConfirm(true);
  };

  const confirmStopShare = () => {
    onStopShare();
    setShowConfirm(false);
    toast({
      title: "Screen Sharing Stopped",
      description: "You have stopped sharing your screen.",
    });
  };

  return (
    <>
      <Button
        variant={isSharing ? "secondary" : "outline"}
        size="icon"
        className={`rounded-full h-12 w-12 ${isSharing ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600' : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'}`}
        onClick={isSharing ? handleStopShareClick : handleStartShare}
        title={isSharing ? "Stop Sharing" : "Share Screen"}
      >
        {isSharing ? <MonitorOff className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
      </Button>

      {isSharing && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <MonitorUp className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-medium">You are sharing your screen</span>
          <button onClick={handleStopShareClick} className="ml-2 hover:bg-blue-700 rounded-full p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop Screen Sharing?</DialogTitle>
            <DialogDescription>
              Participants will no longer see your screen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button onClick={confirmStopShare} className="bg-blue-600 hover:bg-blue-700 text-white">Stop Sharing</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ScreenShareManager;
