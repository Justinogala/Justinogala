
import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const CallControls = ({
  isMuted,
  toggleMute,
  isVideoEnabled,
  toggleVideo,
  isSpeakerOn,
  toggleSpeaker,
  onEndCall,
  callDuration,
  showVideoControls = true,
  isFullscreen,
  toggleFullscreen
}) => {
  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 flex items-center justify-center gap-4 shadow-2xl border border-white/10">
      <div className="flex items-center gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={isMuted ? "destructive" : "secondary"}
                className={cn(
                  "h-12 w-12 rounded-full transition-all duration-300",
                  isMuted ? "bg-red-500/90 hover:bg-red-600" : "bg-white/10 hover:bg-white/20 text-white"
                )}
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isMuted ? 'Unmute' : 'Mute'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {showVideoControls && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={!isVideoEnabled ? "destructive" : "secondary"}
                  className={cn(
                    "h-12 w-12 rounded-full transition-all duration-300",
                    !isVideoEnabled ? "bg-red-500/90 hover:bg-red-600" : "bg-white/10 hover:bg-white/20 text-white"
                  )}
                  onClick={toggleVideo}
                >
                  {!isVideoEnabled ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isVideoEnabled ? 'Stop Video' : 'Start Video'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300"
                onClick={toggleSpeaker}
              >
                {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Speaker</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {toggleFullscreen && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 hidden sm:inline-flex"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Fullscreen</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <div className="w-px h-8 bg-white/20 mx-2" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="destructive"
                className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-110"
                onClick={onEndCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>End Call</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {callDuration && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-4 py-1.5 rounded-full border border-white/10">
          <span className="text-white font-mono text-sm tracking-widest">{callDuration}</span>
        </div>
      )}
    </div>
  );
};

export default CallControls;
