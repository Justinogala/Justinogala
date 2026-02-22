import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Video, VideoOff, 
  Settings, PhoneOff, Users, MessageSquare, 
  Maximize2, Grid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ScreenShareManager from './ScreenShareManager';
import MeetingRecorder from './MeetingRecorder';
import InCallChatPanel from './InCallChatPanel';
import ParticipantManager from './ParticipantManager';

const VideoCallInterface = ({ onEndCall }) => {
  const [controls, setControls] = useState({
    mic: true,
    camera: true,
    screenShare: false,
    recording: false,
    chatOpen: false,
    participantsOpen: false,
    layout: 'speaker' // speaker | grid
  });

  const [activeSpeaker, setActiveSpeaker] = useState({ name: 'Sarah Chen', initial: 'SC', image: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=800&auto=format&fit=crop' });
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  const toggleControl = (key) => {
    setControls(prev => ({
      ...prev,
      [key]: !prev[key],
      // Close side panels if opening another one
      chatOpen: key === 'chatOpen' ? !prev.chatOpen : (key === 'participantsOpen' ? false : prev.chatOpen),
      participantsOpen: key === 'participantsOpen' ? !prev.participantsOpen : (key === 'chatOpen' ? false : prev.participantsOpen)
    }));
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden relative">
      
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Top Bar (Overlay) */}
        <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start pointer-events-none">
          <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 pointer-events-auto flex items-center gap-3">
             <span className="text-white font-medium text-sm">Design Team Sync</span>
             <div className="w-px h-4 bg-white/20"></div>
             <span className="text-slate-300 text-xs">{currentTime}</span>
          </div>
          
          <div className="bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-lg border border-white/10 pointer-events-auto">
             <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/10" onClick={() => setControls(c => ({...c, layout: c.layout === 'grid' ? 'speaker' : 'grid'}))}>
               <Grid className="w-4 h-4" />
             </Button>
          </div>
        </div>

        {/* Video Grid / Speaker View */}
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="w-full h-full relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
             {/* Main Feed */}
             <img 
               src={activeSpeaker.image} 
               alt="Active Speaker" 
               className="w-full h-full object-cover opacity-90"
             />
             
             {/* Name Label */}
             <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-md text-white text-sm font-medium flex items-center gap-2">
               {controls.mic ? <Mic className="w-3 h-3 text-emerald-400" /> : <MicOff className="w-3 h-3 text-red-400" />}
               {activeSpeaker.name}
             </div>

             {/* Self View (PiP) */}
             <motion.div 
               drag
               dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
               className="absolute bottom-4 right-4 w-48 h-32 bg-slate-800 rounded-lg border border-white/20 shadow-xl overflow-hidden cursor-move z-20"
             >
               {!controls.camera ? (
                 <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                   <VideoOff className="w-8 h-8 opacity-50" />
                 </div>
               ) : (
                 <img src="https://images.unsplash.com/photo-1690192079529-9fd57e5b24d0?w=400&auto=format&fit=crop" alt="Me" className="w-full h-full object-cover" />
               )}
               <div className="absolute bottom-1 right-2 text-[10px] text-white/70 font-medium">You</div>
             </motion.div>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="h-20 bg-slate-900/90 backdrop-blur border-t border-slate-800 flex items-center justify-center px-4 gap-3 relative z-30">
          
          <div className="flex items-center gap-3">
            <Button
              variant={controls.mic ? "secondary" : "destructive"}
              size="icon"
              className={`rounded-full h-12 w-12 ${controls.mic ? 'bg-slate-800 text-white hover:bg-slate-700' : ''}`}
              onClick={() => toggleControl('mic')}
            >
              {controls.mic ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            
            <Button
              variant={controls.camera ? "secondary" : "destructive"}
              size="icon"
              className={`rounded-full h-12 w-12 ${controls.camera ? 'bg-slate-800 text-white hover:bg-slate-700' : ''}`}
              onClick={() => toggleControl('camera')}
            >
              {controls.camera ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
          </div>

          <div className="w-px h-8 bg-slate-800 mx-2" />

          <ScreenShareManager 
            isSharing={controls.screenShare} 
            onStartShare={() => setControls(c => ({...c, screenShare: true}))} 
            onStopShare={() => setControls(c => ({...c, screenShare: false}))} 
          />
          
          <MeetingRecorder 
            isRecording={controls.recording} 
            onStartRecording={() => setControls(c => ({...c, recording: true}))} 
            onStopRecording={() => setControls(c => ({...c, recording: false}))} 
          />

          <Button
             variant="ghost"
             size="icon"
             className="rounded-full h-12 w-12 text-slate-400 hover:text-white hover:bg-slate-800"
          >
             <Settings className="w-5 h-5" />
          </Button>

          <div className="w-px h-8 bg-slate-800 mx-2" />

          <Button
            variant="destructive"
            className="rounded-full px-6 h-12 bg-red-600 hover:bg-red-700"
            onClick={onEndCall}
          >
            <PhoneOff className="w-5 h-5 mr-2" /> End Call
          </Button>

          {/* Right Side Toggles */}
          <div className="absolute right-6 flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`rounded-full h-10 w-10 ${controls.participantsOpen ? 'bg-slate-800 text-violet-400' : 'text-slate-400 hover:text-white'}`}
              onClick={() => toggleControl('participantsOpen')}
            >
              <Users className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`rounded-full h-10 w-10 ${controls.chatOpen ? 'bg-slate-800 text-violet-400' : 'text-slate-400 hover:text-white'}`}
              onClick={() => toggleControl('chatOpen')}
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Side Panels */}
      <AnimatePresence>
        {controls.chatOpen && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-80 h-full relative z-20"
          >
            <InCallChatPanel onClose={() => toggleControl('chatOpen')} />
          </motion.div>
        )}
        {controls.participantsOpen && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-80 h-full relative z-20"
          >
            <ParticipantManager onClose={() => toggleControl('participantsOpen')} />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default VideoCallInterface;