import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { videoConferencingUsers } from '@/data/videoConferencingUsers';
import { useVideoCall } from '@/hooks/useVideoCall';
import UserListSidebar from '@/components/video/UserListSidebar';
import CallInterface from '@/components/video/CallInterface';
import AudioCallModal from '@/components/video/AudioCallModal';
import VideoCallModal from '@/components/video/VideoCallModal';
import CallNotification from '@/components/video/CallNotification';
import CallHistoryPanel from '@/components/video/CallHistoryPanel';
import PageTransition from '@/components/PageTransition';

const VideoConferencingPage = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const {
    callState,
    activeCall,
    incomingCall,
    callDuration,
    callHistory,
    isAudioMuted,
    setIsAudioMuted,
    isVideoOff,
    setIsVideoOff,
    initiateCall,
    acceptIncomingCall,
    rejectIncomingCall,
    endCall,
    clearHistory,
    simulateIncomingCall
  } = useVideoCall();

  // Helper to trigger demo incoming call
  const handleSimulateCall = () => {
    const randomUser = videoConferencingUsers[Math.floor(Math.random() * videoConferencingUsers.length)];
    simulateIncomingCall(randomUser, Math.random() > 0.5 ? 'video' : 'audio');
  };

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-64px)] w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <Helmet>
          <title>Video Conferencing | Munal</title>
        </Helmet>

        {/* Left Sidebar */}
        <div className="w-80 flex-shrink-0 border-r border-slate-200 dark:border-slate-800">
          <UserListSidebar 
            users={videoConferencingUsers} 
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
          />
        </div>

        {/* Center Call Interface */}
        <div className="flex-1 min-w-0 relative">
          <CallInterface 
            selectedUser={selectedUser}
            onStartAudioCall={() => initiateCall(selectedUser, 'audio')}
            onStartVideoCall={() => initiateCall(selectedUser, 'video')}
          />
          
          {/* Debug Button for Demo */}
          <button 
            onClick={handleSimulateCall}
            className="absolute bottom-4 left-4 text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded opacity-50 hover:opacity-100"
          >
            Simulate Incoming Call
          </button>
        </div>

        {/* Right History Panel */}
        <div className="hidden xl:block h-full">
          <CallHistoryPanel 
            history={callHistory}
            onClearHistory={clearHistory}
          />
        </div>

        {/* Modals & Overlays */}
        <CallNotification 
          incomingCall={incomingCall}
          onAccept={acceptIncomingCall}
          onReject={rejectIncomingCall}
        />

        {activeCall?.type === 'audio' && (
          <AudioCallModal 
            isOpen={true}
            activeCall={activeCall}
            duration={callDuration}
            onEndCall={endCall}
            isMuted={isAudioMuted}
            toggleMute={() => setIsAudioMuted(!isAudioMuted)}
            callState={callState}
          />
        )}

        {activeCall?.type === 'video' && (
          <VideoCallModal 
            isOpen={true}
            activeCall={activeCall}
            duration={callDuration}
            onEndCall={endCall}
            isMuted={isAudioMuted}
            toggleMute={() => setIsAudioMuted(!isAudioMuted)}
            isVideoOff={isVideoOff}
            toggleVideo={() => setIsVideoOff(!isVideoOff)}
            callState={callState}
          />
        )}
      </div>
    </PageTransition>
  );
};

export default VideoConferencingPage;