
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PhoneOff, Clock, Users, Save } from 'lucide-react';
import { useCallState } from '@/context/CallStateContext';

const CallEndDialog = () => {
  const { showEndDialog, setShowEndDialog, terminateCall, activeCall, participants, isRecording } = useCallState();

  if (!activeCall) return null;

  const duration = Math.floor((Date.now() - activeCall.startTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  return (
    <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800 shadow-2xl">
        <DialogHeader>
          <div className="mx-auto bg-red-100 dark:bg-red-900/20 p-3 rounded-full mb-4">
            <PhoneOff className="w-8 h-8 text-red-600 dark:text-red-500" />
          </div>
          <DialogTitle className="text-center text-xl">End current call?</DialogTitle>
          <DialogDescription className="text-center">
            Are you sure you want to leave "{activeCall.title}"?
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl text-center">
            <Clock className="w-5 h-5 mx-auto mb-2 text-indigo-500" />
            <div className="text-2xl font-bold font-mono text-gray-900 dark:text-white">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            <p className="text-xs text-gray-500">Duration</p>
          </div>
          <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl text-center">
            <Users className="w-5 h-5 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {participants.length}
            </div>
            <p className="text-xs text-gray-500">Participants</p>
          </div>
        </div>

        {isRecording && (
          <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm mb-4">
            <Save className="w-4 h-4" />
            <span>Recording will be saved automatically.</span>
          </div>
        )}

        <DialogFooter className="sm:justify-between gap-2">
          <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setShowEndDialog(false)}>
            Continue Call
          </Button>
          <Button variant="destructive" className="w-full sm:w-auto bg-red-600 hover:bg-red-700" onClick={terminateCall}>
            End Call Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CallEndDialog;
