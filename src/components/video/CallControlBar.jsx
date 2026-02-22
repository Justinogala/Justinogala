
import React from 'react';
import { 
  Mic, MicOff, Video, VideoOff, MonitorUp, MonitorOff, 
  Disc, Hand, Settings, PhoneOff, Users, MessageSquare 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import BackgroundButton from './BackgroundButton';
import { useBackgroundManager } from '@/hooks/useBackgroundManager';

const CallControlBar = ({ 
  isMuted, toggleMute, 
  isCameraOff, toggleCamera, 
  isScreenSharing, startScreenShare, stopScreenShare, 
  isRecording, startRecording, stopRecording,
  isHandRaised, raiseHand, lowerHand,
  onEndCall,
  onOpenSettings,
  onToggleParticipants,
  onToggleChat
}) => {
  const { activeBackground } = useBackgroundManager();

  const ControlButton = ({ 
    active, 
    onClick, 
    onIcon: OnIcon, 
    offIcon: OffIcon, 
    label, 
    danger = false,
    warning = false,
    className,
    children
  }) => (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant={danger ? "destructive" : (active ? "secondary" : "default")}
            size="icon"
            onClick={onClick}
            className={cn(
              "rounded-full w-12 h-12 transition-all duration-200 shadow-lg",
              active && !danger && !warning ? "bg-white text-gray-900 hover:bg-gray-200" : "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700",
              danger && "bg-red-600 hover:bg-red-700 border-red-600 shadow-red-500/20",
              warning && "bg-yellow-500 text-black hover:bg-yellow-600 border-yellow-500",
              className
            )}
          >
            {children ? children : (active ? <OnIcon className="w-5 h-5" /> : <OffIcon className="w-5 h-5" />)}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-900 text-white border-gray-800">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="h-20 px-6 bg-gray-900/90 backdrop-blur-md border-t border-gray-800 flex items-center justify-center gap-4 relative z-50 shadow-2xl">
      
      {/* Left Group */}
      <div className="absolute left-6 hidden md:flex items-center gap-2 text-white/50 text-sm font-mono">
         {/* Could put time or connection info here */}
         <span>00:00</span>
      </div>

      {/* Center Group */}
      <div className="flex items-center gap-3">
        <ControlButton 
          active={!isMuted} 
          onClick={toggleMute} 
          onIcon={Mic} 
          offIcon={MicOff} 
          label={isMuted ? "Unmute (M)" : "Mute (M)"}
          className={isMuted ? "bg-red-500/20 text-red-500 border-red-500/50" : ""}
        />
        
        <ControlButton 
          active={!isCameraOff} 
          onClick={toggleCamera} 
          onIcon={Video} 
          offIcon={VideoOff} 
          label={isCameraOff ? "Start Video (V)" : "Stop Video (V)"}
          className={isCameraOff ? "bg-red-500/20 text-red-500 border-red-500/50" : ""}
        />

        <div className="w-px h-8 bg-gray-700 mx-2" />
        
        {/* Background Button Integration */}
        <div className="relative group">
          <BackgroundButton />
          {activeBackground.id !== 'none' && (
             <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
               {activeBackground.name || 'Effect Active'}
             </div>
          )}
        </div>

        <ControlButton 
          active={isScreenSharing} 
          onClick={isScreenSharing ? stopScreenShare : startScreenShare} 
          onIcon={MonitorOff} 
          offIcon={MonitorUp} 
          label={isScreenSharing ? "Stop Sharing" : "Share Screen"}
          className={isScreenSharing ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" : ""}
        />

        <ControlButton 
          active={isRecording} 
          onClick={isRecording ? stopRecording : startRecording} 
          onIcon={Disc} 
          offIcon={Disc} 
          label={isRecording ? "Stop Recording" : "Record"}
          className={isRecording ? "bg-red-500 text-white border-red-500 animate-pulse" : ""}
        />

        <ControlButton 
          active={isHandRaised} 
          onClick={isHandRaised ? () => lowerHand('local') : raiseHand} 
          onIcon={Hand} 
          offIcon={Hand} 
          label={isHandRaised ? "Lower Hand" : "Raise Hand"}
          warning={isHandRaised}
        />

        <div className="w-px h-8 bg-gray-700 mx-2" />
        
        <ControlButton 
          active={false} 
          onClick={onEndCall} 
          onIcon={PhoneOff} 
          offIcon={PhoneOff} 
          label="Leave Call"
          danger={true}
        />
      </div>

      {/* Right Group */}
      <div className="absolute right-6 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onToggleParticipants} className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full">
          <Users className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleChat} className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full">
          <MessageSquare className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onOpenSettings} className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full">
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default CallControlBar;
