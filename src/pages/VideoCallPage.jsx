
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVideoCall } from '@/hooks/useVideoCall';
import CameraPreviewModal from '@/components/CameraPreviewModal';
import OutgoingCallScreen from '@/components/OutgoingCallScreen';
import VideoCallScreen from '@/components/VideoCallScreen';
import IncomingCallNotification from '@/components/IncomingCallNotification'; // For testing purposes

const VideoCallPage = () => {
  const navigate = useNavigate();
  const { 
    callState, 
    localStream, 
    remoteStream, 
    isAudioEnabled, 
    isVideoEnabled, 
    callDuration,
    initiateCall,
    endCall,
    toggleAudio,
    toggleVideo
  } = useVideoCall();

  const [isPreviewOpen, setIsPreviewOpen] = useState(true);

  // Auto-redirect if call ends
  useEffect(() => {
    if (callState === 'idle' && !isPreviewOpen) {
       // Wait a moment before redirecting to show "Call Ended" or similar
       const timer = setTimeout(() => {
          navigate(-1); // Go back
       }, 1000);
       return () => clearTimeout(timer);
    }
  }, [callState, isPreviewOpen, navigate]);

  const handleStartCall = () => {
    setIsPreviewOpen(false);
    initiateCall(true);
  };

  const handleCancelPreview = () => {
    setIsPreviewOpen(false);
    navigate(-1);
  };

  return (
    <div className="h-screen w-full bg-gray-900 overflow-hidden relative">
      
      {/* Initial Preview Modal */}
      <CameraPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={handleCancelPreview}
        onStartCall={handleStartCall}
      />

      {/* States */}
      {callState === 'initiating' && (
        <div className="flex items-center justify-center h-full text-white">
             <p>Connecting...</p>
        </div>
      )}

      {callState === 'ringing' && (
        <OutgoingCallScreen 
            recipientName="Remote User" 
            onCancel={() => {
                endCall();
                navigate(-1);
            }} 
        />
      )}

      {callState === 'connected' && (
        <VideoCallScreen 
            localStream={localStream}
            remoteStream={remoteStream}
            isAudioOn={isAudioEnabled}
            isVideoOn={isVideoEnabled}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onEndCall={() => {
                endCall();
                navigate(-1);
            }}
            duration={callDuration}
        />
      )}
    </div>
  );
};

export default VideoCallPage;
