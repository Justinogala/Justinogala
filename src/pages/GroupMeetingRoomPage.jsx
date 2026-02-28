import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, Users, 
  MessageSquare, Monitor, MonitorOff, Copy, Check, Clock, Calendar,
  Hand, MoreHorizontal, Grid, Maximize2, Volume2, Menu, X, Sparkles,
  Circle, Square, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import useGroupWebRTC from '@/hooks/useGroupWebRTC';
import useAudioLevelDetection from '@/hooks/useAudioLevelDetection';
import useVirtualBackground, { BACKGROUND_EFFECTS } from '@/hooks/useVirtualBackground';
import VirtualBackgroundSelector from '@/components/meetings/VirtualBackgroundSelector';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

// Audio level indicator component
const AudioLevelIndicator = ({ level, isActive }) => {
  const bars = 5;
  const activeColor = isActive ? 'bg-green-500' : 'bg-slate-500';
  
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[...Array(bars)].map((_, i) => {
        const barHeight = ((i + 1) / bars) * 100;
        const isBarActive = level * 100 > (i / bars) * 100;
        return (
          <div
            key={i}
            className={cn(
              "w-1 rounded-full transition-all duration-75",
              isBarActive ? activeColor : 'bg-slate-700'
            )}
            style={{ height: `${barHeight}%` }}
          />
        );
      })}
    </div>
  );
};

// Participant Video Tile Component - Fixed for camera display
const ParticipantTile = ({ 
  participant, 
  stream, 
  isLocal, 
  isActiveSpeaker,
  isFocused,
  audioLevel = 0,
  onFocus 
}) => {
  const videoRef = useRef(null);
  
  // Handle video playback when stream changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    console.log(`[ParticipantTile] ${participant.user_name}: Setting up video`, {
      streamId: stream?.id || 'null',
      streamActive: stream?.active,
      videoTracks: stream?.getVideoTracks()?.length || 0,
      videoTracksDetails: stream?.getVideoTracks()?.map(t => ({ id: t.id, enabled: t.enabled, readyState: t.readyState })),
      videoEnabled: participant.video_enabled,
      isLocal
    });
    
    // Always set srcObject - this is critical!
    video.srcObject = stream || null;
    
    if (!stream || !stream.active) {
      console.log(`[ParticipantTile] ${participant.user_name}: No active stream`);
      return;
    }
    
    const videoTracks = stream.getVideoTracks();
    
    // CRITICAL: Ensure video track is enabled based on participant.video_enabled
    if (videoTracks.length > 0 && participant.video_enabled) {
      videoTracks.forEach(t => {
        if (!t.enabled) {
          console.log(`[ParticipantTile] ${participant.user_name}: Enabling video track`, t.id);
          t.enabled = true;
        }
      });
      
      // Try to play
      video.play().catch(err => {
        console.log(`[ParticipantTile] ${participant.user_name}: Play failed:`, err.name);
      });
    } else if (videoTracks.length > 0 && !participant.video_enabled) {
      // Disable video tracks when video is turned off
      videoTracks.forEach(t => {
        if (t.enabled) {
          console.log(`[ParticipantTile] ${participant.user_name}: Disabling video track`, t.id);
          t.enabled = false;
        }
      });
    }
  }, [stream, participant.user_name, participant.video_enabled, isLocal]);
  
  const initials = participant.user_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'U';
  
  // Show video based on participant's video_enabled state and stream existence
  // We trust participant.video_enabled as the source of truth, not track.enabled
  const hasStream = stream && stream.active;
  const hasVideoTrack = stream?.getVideoTracks()?.length > 0;
  const showVideo = participant.video_enabled && hasStream && hasVideoTrack;
  
  // Debug logging for showVideo calculation
  console.log(`[ParticipantTile] ${participant.user_name}: showVideo calculation`, {
    'participant.video_enabled': participant.video_enabled,
    'hasStream': hasStream,
    'hasVideoTrack': hasVideoTrack,
    'stream.active': stream?.active,
    'videoTracksCount': stream?.getVideoTracks()?.length,
    'RESULT showVideo': showVideo
  });
  
  return (
    <motion.div 
      layout
      className={cn(
        "relative bg-slate-800 rounded-xl overflow-hidden transition-all duration-300 min-h-[120px] sm:min-h-[150px]",
        isActiveSpeaker && "ring-2 ring-green-500 ring-offset-2 ring-offset-slate-950",
        isFocused && "col-span-2 row-span-2"
      )}
      onClick={() => onFocus && onFocus(participant.user_id)}
      data-testid={`participant-tile-${participant.user_id}`}
    >
      {/* Video element - ALWAYS rendered, visibility controlled by CSS */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-opacity duration-200",
          showVideo ? "opacity-100 z-10" : "opacity-0 z-0"
        )}
      />
      
      {/* Avatar fallback when video is off */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 transition-opacity duration-200",
        showVideo ? "opacity-0 z-0" : "opacity-100 z-5"
      )}>
        <Avatar className={cn("transition-all", isFocused ? "h-24 w-24 sm:h-32 sm:w-32" : "h-14 w-14 sm:h-20 sm:w-20")}>
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl sm:text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
      
      {/* Participant info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-black/70 to-transparent z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-white text-xs sm:text-sm font-medium truncate max-w-[80px] sm:max-w-[120px]">
              {participant.user_name}{isLocal && ' (You)'}
            </span>
            {isActiveSpeaker && (
              <AudioLevelIndicator level={audioLevel} isActive={true} />
            )}
          </div>
          <div className="flex items-center gap-1">
            {!participant.audio_enabled && (
              <span className="bg-red-500/80 text-white p-0.5 sm:p-1 rounded-full">
                <MicOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </span>
            )}
            {participant.hand_raised && (
              <span className="bg-yellow-500/80 text-white p-0.5 sm:p-1 rounded-full">
                <Hand className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Speaker indicator */}
      {isActiveSpeaker && (
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20">
          <Badge className="bg-green-500/90 text-white text-[10px] sm:text-xs px-1.5 py-0.5">
            Speaking
          </Badge>
        </div>
      )}
    </motion.div>
  );
};

// Grid Layout Component - Mobile responsive with adaptive layout
const VideoGrid = ({ 
  participants, 
  localStream, 
  remoteStreams, 
  localUserId, 
  activeSpeaker,
  focusedParticipant,
  audioLevels,
  onFocusParticipant
}) => {
  const count = participants.length;
  
  // Determine grid layout based on participant count - mobile first
  const getGridClass = () => {
    // Mobile (default)
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-2 sm:grid-cols-3';
    if (count <= 9) return 'grid-cols-2 sm:grid-cols-3';
    if (count <= 12) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'; // Max 16 participants
  };
  
  // Sort participants: local user last, active speaker first
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.user_id === localUserId) return 1;
    if (b.user_id === localUserId) return -1;
    if (a.user_id === activeSpeaker) return -1;
    if (b.user_id === activeSpeaker) return 1;
    return 0;
  });
  
  return (
    <div className={cn(
      "h-full grid gap-2 sm:gap-3 p-2 sm:p-4 auto-rows-fr",
      getGridClass()
    )}>
      <AnimatePresence mode="popLayout">
        {sortedParticipants.map(participant => {
          const isLocal = participant.user_id === localUserId;
          const stream = isLocal ? localStream : remoteStreams.get(participant.user_id);
          const audioLevel = audioLevels?.get(participant.user_id) || 0;
          
          // Debug logging
          if (isLocal) {
            console.log('[VideoGrid] Local participant stream check:', {
              localUserId,
              streamExists: !!localStream,
              streamId: localStream?.id,
              streamActive: localStream?.active,
              videoTracks: localStream?.getVideoTracks()?.length,
              videoTracksEnabled: localStream?.getVideoTracks()?.map(t => ({ id: t.id, enabled: t.enabled })),
              participantVideoEnabled: participant.video_enabled
            });
          }
          
          return (
            <ParticipantTile
              key={participant.user_id}
              participant={participant}
              stream={stream}
              isLocal={isLocal}
              isActiveSpeaker={participant.user_id === activeSpeaker}
              isFocused={participant.user_id === focusedParticipant}
              audioLevel={audioLevel}
              onFocus={onFocusParticipant}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Main Group Meeting Room Component
const GroupMeetingRoomPage = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Meeting state
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  
  // Media state
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [previewStream, setPreviewStream] = useState(null);
  const [streamKey, setStreamKey] = useState(0); // Force re-render when stream changes
  
  // Custom setter that also updates streamKey
  const updateLocalStream = useCallback((newStream) => {
    console.log('[updateLocalStream] Setting new stream:', newStream?.id);
    setLocalStream(newStream);
    setStreamKey(prev => prev + 1);
  }, []);
  
  // UI state
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [copied, setCopied] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState(null);
  const [handRaised, setHandRaised] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [focusedParticipant, setFocusedParticipant] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [detectedActiveSpeaker, setDetectedActiveSpeaker] = useState(null);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [isSavingRecording, setIsSavingRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  
  // Virtual background state
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [backgroundEffect, setBackgroundEffect] = useState(BACKGROUND_EFFECTS.NONE);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [virtualBgEnabled, setVirtualBgEnabled] = useState(false);
  
  // Refs
  const previewVideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  
  // Remote streams storage
  const [remoteStreamMap, setRemoteStreamMap] = useState(new Map());
  
  // Group WebRTC hook
  const {
    participants,
    isConnected,
    activeSpeaker,
    getRemoteStreams,
    joinRoom,
    leaveRoom,
    updateParticipantStatus
  } = useGroupWebRTC({
    roomId: meetingId,
    userId: user?.id,
    userName: user?.name || 'Anonymous',
    localStream,
    onRemoteStream: (participantId, participantName, stream) => {
      console.log(`Remote stream received from ${participantName}`);
      setRemoteStreamMap(prev => {
        const newMap = new Map(prev);
        newMap.set(participantId, stream);
        return newMap;
      });
    },
    onParticipantJoined: (participant) => {
      toast({ title: `${participant.user_name} joined the meeting` });
    },
    onParticipantLeft: (userId) => {
      setRemoteStreamMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
      toast({ title: 'A participant left the meeting' });
    }
  });
  
  // Audio level detection for automatic speaker spotlight
  const {
    audioLevels,
    isUserSpeaking
  } = useAudioLevelDetection({
    localStream: joined ? localStream : null,
    remoteStreams: joined ? remoteStreamMap : new Map(),
    localUserId: user?.id,
    onActiveSpeakerChange: (speakerId) => {
      setDetectedActiveSpeaker(speakerId);
      // Notify server about active speaker
      if (speakerId === user?.id) {
        updateParticipantStatus({ is_speaking: true });
      }
    },
    threshold: 0.02,
    speakingDebounce: 300
  });
  
  // Virtual background processing
  const {
    outputStream: processedStream,
    isLoading: bgLoading,
    isProcessing: bgProcessing,
    modelReady: bgModelReady,
    fps: bgFps
  } = useVirtualBackground({
    inputStream: localStream,
    enabled: virtualBgEnabled && backgroundEffect !== BACKGROUND_EFFECTS.NONE,
    effect: backgroundEffect,
    backgroundImage: selectedBackground?.url || null,
    backgroundColor: selectedBackground?.color || null,
    onError: (err) => {
      console.error('Virtual background error:', err);
      toast({ 
        variant: 'destructive', 
        title: 'Background effect error',
        description: 'Could not apply background effect. Try a simpler effect.'
      });
    }
  });
  
  // Use processed stream if virtual background is enabled AND processing, otherwise use raw local stream
  // This ensures we always have a valid stream when localStream is available
  // Note: streamKey is included to force re-evaluation when tracks are toggled
  const displayStream = React.useMemo(() => {
    // streamKey forces re-evaluation when needed
    console.log('[displayStream] Computing, streamKey:', streamKey, 'localStream:', localStream?.id);
    if (virtualBgEnabled && bgProcessing && processedStream) {
      return processedStream;
    }
    return localStream;
  }, [virtualBgEnabled, bgProcessing, processedStream, localStream, streamKey]);
  
  // Debug: Log stream status
  React.useEffect(() => {
    console.log('[Stream Status]:', {
      streamKey,
      localStream: localStream?.id,
      localStreamActive: localStream?.active,
      localStreamVideoTracks: localStream?.getVideoTracks()?.length,
      displayStream: displayStream?.id,
      displayStreamActive: displayStream?.active,
      displayStreamVideoTracks: displayStream?.getVideoTracks()?.length,
      virtualBgEnabled,
      bgProcessing,
      isVideoEnabled,
      joined
    });
  }, [localStream, displayStream, virtualBgEnabled, bgProcessing, streamKey, isVideoEnabled, joined]);
  
  // Use detected speaker or manual speaker
  const currentActiveSpeaker = detectedActiveSpeaker || activeSpeaker;
  
  // Load meeting details
  useEffect(() => {
    const loadMeeting = async () => {
      try {
        const response = await fetch(`${API_URL}/api/calendar/events/${meetingId}`);
        if (response.ok) {
          const data = await response.json();
          setMeeting(data);
        } else {
          // Create instant meeting
          setMeeting({
            id: meetingId,
            title: 'Instant Meeting',
            description: 'Quick meeting started from dashboard',
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            video_call: true,
            isInstant: true,
            invitees: []
          });
        }
      } catch (err) {
        console.error('Error loading meeting:', err);
        setMeeting({
          id: meetingId,
          title: 'Instant Meeting',
          description: 'Quick meeting started from dashboard',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          video_call: true,
          isInstant: true,
          invitees: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (meetingId) loadMeeting();
  }, [meetingId]);
  
  // Start camera preview
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });
      
      console.log('Camera stream obtained:', stream.id);
      setPreviewStream(stream);
      
      // Attach stream to video element with proper handling
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
        
        // Wait for video metadata to load before playing
        await new Promise((resolve, reject) => {
          const video = previewVideoRef.current;
          if (!video) {
            reject(new Error('Video element not found'));
            return;
          }
          
          const handleLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            resolve();
          };
          
          // If metadata is already loaded
          if (video.readyState >= 1) {
            resolve();
          } else {
            video.addEventListener('loadedmetadata', handleLoadedMetadata);
          }
          
          // Timeout fallback
          setTimeout(resolve, 2000);
        });
        
        // Now play the video
        try {
          await previewVideoRef.current.play();
          console.log('Camera preview playing successfully');
        } catch (playError) {
          console.warn('Video autoplay prevented:', playError);
          // Video will need user interaction to play
        }
      }
    } catch (err) {
      console.error('Camera error:', err);
      let errorMsg = 'Could not access camera.';
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Camera access denied. Click "Enable Camera" and allow access.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No camera found. Please connect a camera.';
      } else if (err.name === 'NotReadableError') {
        errorMsg = 'Camera is in use by another app.';
      } else if (err.name === 'OverconstrainedError') {
        errorMsg = 'Camera does not support the requested settings.';
      }
      setCameraError(errorMsg);
    }
  }, []);
  
  // Auto-start camera on mount
  useEffect(() => {
    if (!loading && !joined) {
      startCamera();
    }
  }, [loading, joined, startCamera]);
  
  // Cleanup preview stream on unmount
  useEffect(() => {
    return () => {
      if (previewStream && !joined) {
        previewStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [previewStream, joined]);
  
  // Call duration timer
  useEffect(() => {
    let interval;
    if (joined && callStartTime) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [joined, callStartTime]);
  
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Join meeting
  const joinMeeting = async () => {
    try {
      let stream = previewStream;
      
      console.log('[joinMeeting] previewStream:', {
        exists: !!previewStream,
        id: previewStream?.id,
        active: previewStream?.active,
        videoTracks: previewStream?.getVideoTracks().length,
        isVideoEnabled,
        isAudioEnabled
      });
      
      if (!stream || !stream.active) {
        console.log('[joinMeeting] Creating new stream...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: true
        });
        console.log('[joinMeeting] New stream created:', stream.id);
      }
      
      // CRITICAL: Sync track enabled state with UI state
      // This handles the case where user toggled video/audio OFF in the preview
      stream.getVideoTracks().forEach(track => {
        track.enabled = isVideoEnabled;
        console.log('[joinMeeting] Video track', track.id, 'enabled:', track.enabled);
      });
      stream.getAudioTracks().forEach(track => {
        track.enabled = isAudioEnabled;
        console.log('[joinMeeting] Audio track', track.id, 'enabled:', track.enabled);
      });
      
      console.log('[joinMeeting] Setting localStream:', {
        streamId: stream.id,
        active: stream.active,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        videoEnabled: stream.getVideoTracks()[0]?.enabled,
        audioEnabled: stream.getAudioTracks()[0]?.enabled
      });
      
      updateLocalStream(stream);
      setJoined(true);
      setCallStartTime(Date.now());
      
      // Join the room after a small delay to ensure state is updated
      setTimeout(async () => {
        const result = await joinRoom(isVideoEnabled, isAudioEnabled);
        if (result.success) {
          toast({ title: 'Joined meeting', description: meeting?.title || 'Group Meeting' });
        } else {
          toast({ variant: 'destructive', title: 'Failed to join', description: result.error });
        }
      }, 100);
      
    } catch (err) {
      console.error('Error joining meeting:', err);
      toast({ 
        variant: 'destructive', 
        title: 'Camera/Mic access denied',
        description: 'Please allow camera and microphone access to join the meeting'
      });
    }
  };
  
  // Leave meeting
  const leaveMeeting = async () => {
    await leaveRoom();
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setJoined(false);
    navigate('/meetings');
  };
  
  // Toggle audio
  const toggleAudio = async () => {
    const newState = !isAudioEnabled;
    
    if (localStream && localStream.getAudioTracks().length > 0) {
      // We have audio tracks, just toggle them
      localStream.getAudioTracks().forEach(track => {
        track.enabled = newState;
      });
    } else if (newState) {
      // Need to get audio permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioTrack = stream.getAudioTracks()[0];
        
        if (localStream) {
          localStream.addTrack(audioTrack);
        } else {
          updateLocalStream(stream);
        }
        console.log('[toggleAudio] Audio track added');
      } catch (err) {
        console.error('[toggleAudio] Failed to get audio:', err);
        toast({ variant: 'destructive', title: 'Could not access microphone' });
        return;
      }
    }
    
    setIsAudioEnabled(newState);
    updateParticipantStatus({ audio_enabled: newState });
  };
  
  // Toggle video
  const toggleVideo = async () => {
    const newState = !isVideoEnabled;
    console.log('[toggleVideo] Toggling video to:', newState, 'localStream:', !!localStream);
    
    if (localStream && localStream.getVideoTracks().length > 0) {
      // We have video tracks, just toggle them
      console.log('[toggleVideo] Enabling/disabling existing video tracks');
      localStream.getVideoTracks().forEach(track => {
        track.enabled = newState;
        console.log('[toggleVideo] Track', track.id, 'enabled:', track.enabled);
      });
      setIsVideoEnabled(newState);
      // CRITICAL: Force re-render by updating streamKey
      setStreamKey(prev => prev + 1);
      updateParticipantStatus({ video_enabled: newState });
    } else if (newState) {
      // Need to get video permission - no stream or no video tracks
      console.log('[toggleVideo] Requesting camera access...');
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });
        
        const videoTrack = videoStream.getVideoTracks()[0];
        console.log('[toggleVideo] Got video track:', videoTrack.id, 'enabled:', videoTrack.enabled);
        
        if (localStream) {
          // Create a new MediaStream with all existing tracks plus the new video track
          const existingTracks = localStream.getTracks();
          const newStream = new MediaStream([...existingTracks, videoTrack]);
          
          // Stop the old video-only stream (we don't need it anymore)
          // videoStream tracks are now in newStream
          
          updateLocalStream(newStream);
          console.log('[toggleVideo] Created new stream with video track added');
        } else {
          // No existing stream, just use the video stream
          updateLocalStream(videoStream);
          console.log('[toggleVideo] Set new stream with video');
        }
        
        setIsVideoEnabled(true);
        updateParticipantStatus({ video_enabled: true });
        toast({ title: 'Camera started' });
      } catch (err) {
        console.error('[toggleVideo] Failed to get camera:', err);
        let errorMsg = 'Could not access camera';
        if (err.name === 'NotAllowedError') {
          errorMsg = 'Camera access denied. Please allow camera access.';
        } else if (err.name === 'NotFoundError') {
          errorMsg = 'No camera found. Please connect a camera.';
        } else if (err.name === 'NotReadableError') {
          errorMsg = 'Camera is in use by another app.';
        }
        toast({ variant: 'destructive', title: errorMsg });
      }
    } else {
      // Turning off video - just update state
      setIsVideoEnabled(false);
      // CRITICAL: Force re-render by updating streamKey
      setStreamKey(prev => prev + 1);
      updateParticipantStatus({ video_enabled: false });
    }
  };
  
  // Toggle hand raise
  const toggleHandRaise = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    updateParticipantStatus({ hand_raised: newState });
  };
  
  // Toggle screen share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        screenStreamRef.current = screenStream;
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };
        setIsScreenSharing(true);
        toast({ title: 'Screen sharing started' });
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    }
  };
  
  // Copy meeting link
  const copyMeetingLink = () => {
    const link = `${window.location.origin}/workspace/meeting/${meetingId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Link copied!' });
  };
  
  // Send chat message
  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      sender: user?.name || 'You',
      message: chatInput,
      time: new Date().toLocaleTimeString()
    }]);
    setChatInput('');
  };
  
  // Merge local user's current state with participants list
  // This must be before any early returns as it's a hook
  const allParticipants = React.useMemo(() => {
    console.log('[allParticipants] Computing:', {
      participantsLength: participants.length,
      userId: user?.id,
      userName: user?.name,
      isVideoEnabled,
      participants: participants.map(p => ({ id: p.user_id, name: p.user_name }))
    });
    
    if (participants.length === 0) {
      // Fallback when not connected to room yet
      return [{
        user_id: user?.id,
        user_name: user?.name || 'You',
        video_enabled: isVideoEnabled,
        audio_enabled: isAudioEnabled,
        hand_raised: handRaised
      }];
    }
    
    // Check if current user is in the participants list
    const currentUserInList = participants.find(p => p.user_id === user?.id);
    console.log('[allParticipants] Current user in list:', currentUserInList);
    
    // Update local user's state in the participants list
    return participants.map(p => {
      if (p.user_id === user?.id) {
        return {
          ...p,
          video_enabled: isVideoEnabled,
          audio_enabled: isAudioEnabled,
          hand_raised: handRaised
        };
      }
      return p;
    });
  }, [participants, user?.id, user?.name, isVideoEnabled, isAudioEnabled, handRaised]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  // Pre-join screen
  if (!joined) {
    const meetingTitle = meeting?.title || 'Group Meeting';
    const isInstantMeeting = meeting?.isInstant || !meeting;
    
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
          <Helmet><title>{meetingTitle} | Munal AI</title></Helmet>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full"
          >
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
              {/* Meeting Info */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-white">{meetingTitle}</h1>
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                    <Users className="w-3 h-3 mr-1" />
                    Group Call
                  </Badge>
                  {isInstantMeeting && (
                    <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                      Instant
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                  {meeting?.start_time && !isInstantMeeting && (
                    <>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(parseISO(meeting.start_time), 'EEEE, MMMM d')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{format(parseISO(meeting.start_time), 'h:mm a')}</span>
                      </div>
                    </>
                  )}
                  {isInstantMeeting && (
                    <div className="flex items-center gap-2 text-violet-400">
                      <Video className="w-4 h-4" />
                      <span>Ready to start (up to 16 participants)</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Video Preview */}
              <div className="p-6">
                <div className="relative aspect-video bg-slate-800 rounded-2xl overflow-hidden mb-6">
                  <video
                    ref={previewVideoRef}
                    autoPlay
                    playsInline
                    muted
                    onCanPlay={(e) => {
                      // Ensure video plays when it can
                      e.target.play().catch(err => console.log('Auto-play prevented:', err));
                    }}
                    className={cn(
                      "w-full h-full object-cover transition-opacity",
                      (!isVideoEnabled || !previewStream) ? "opacity-0 absolute" : "opacity-100"
                    )}
                  />
                  
                  {/* Avatar when no video */}
                  {(!isVideoEnabled || !previewStream) && !cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                      <div className="text-center">
                        <Avatar className="h-24 w-24 mx-auto mb-3">
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-3xl">
                            {user?.name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {!previewStream && !cameraError && (
                          <p className="text-gray-400 text-sm">Starting camera...</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Camera error */}
                  {cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                      <div className="text-center px-8">
                        <Avatar className="h-20 w-20 mx-auto mb-4">
                          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white text-3xl">
                            <VideoOff className="w-8 h-8" />
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-gray-300 text-sm mb-4">{cameraError}</p>
                        <Button 
                          onClick={startCamera}
                          className="bg-violet-600 hover:bg-violet-700 text-white"
                          data-testid="enable-camera-btn"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Enable Camera
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Controls Preview */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-2">
                        <Button
                          size="lg"
                          className={cn(
                            "rounded-full h-16 w-16 shadow-lg transition-all",
                            isAudioEnabled 
                              ? "bg-slate-600 hover:bg-slate-500 text-white border-2 border-slate-500" 
                              : "bg-red-500 hover:bg-red-400 text-white border-2 border-red-400"
                          )}
                          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                          data-testid="preview-mic-btn"
                        >
                          {isAudioEnabled ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
                        </Button>
                        <span className="text-sm font-medium text-white">{isAudioEnabled ? 'Mute' : 'Unmute'}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isAudioEnabled ? 'Turn off microphone' : 'Turn on microphone'}</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-2">
                        <Button
                          size="lg"
                          className={cn(
                            "rounded-full h-16 w-16 shadow-lg transition-all",
                            isVideoEnabled 
                              ? "bg-slate-600 hover:bg-slate-500 text-white border-2 border-slate-500" 
                              : "bg-red-500 hover:bg-red-400 text-white border-2 border-red-400"
                          )}
                          onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                          data-testid="preview-video-btn"
                        >
                          {isVideoEnabled ? <Video className="w-7 h-7" /> : <VideoOff className="w-7 h-7" />}
                        </Button>
                        <span className="text-sm font-medium text-white">{isVideoEnabled ? 'Stop Video' : 'Start Video'}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                {/* Join Button */}
                <div className="flex gap-3">
                  <Button
                    onClick={joinMeeting}
                    className="flex-1 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-lg font-semibold"
                    data-testid="join-group-meeting-btn"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Join Group Meeting
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-12 border-slate-600"
                        onClick={copyMeetingLink}
                        data-testid="copy-link-btn"
                      >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy meeting link</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </TooltipProvider>
    );
  }
  
  // In-meeting view with grid
  return (
    <div className="h-screen bg-slate-950 flex flex-col" data-testid="group-meeting-room">
      <Helmet><title>{meeting?.title || 'Group Meeting'} | Meeting</title></Helmet>
      
      {/* Header - Mobile optimized */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-slate-900/80 border-b border-white/10">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <h1 className="text-sm sm:text-lg font-semibold text-white truncate max-w-[120px] sm:max-w-none">{meeting?.title || 'Meeting'}</h1>
          <Badge variant="secondary" className="bg-red-500/20 text-red-400 text-xs sm:text-sm shrink-0">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 mr-1 sm:mr-2 animate-pulse" />
            {formatDuration(callDuration)}
          </Badge>
          <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 text-xs sm:text-sm hidden sm:flex">
            <Users className="w-3 h-3 mr-1" />
            {allParticipants.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" onClick={copyMeetingLink} className="text-gray-400 hover:text-white hidden sm:flex">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            Invite
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={copyMeetingLink} 
            className="text-gray-400 hover:text-white sm:hidden h-8 w-8"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
          <Button 
            variant={showParticipants ? "default" : "ghost"} 
            size="sm" 
            className="text-gray-400 hover:text-white h-8 px-2 sm:px-3"
            onClick={() => setShowParticipants(!showParticipants)}
            data-testid="toggle-participants-btn"
          >
            <Users className="w-4 h-4 sm:mr-2" />
            <span className="sm:inline">{allParticipants.length}</span>
          </Button>
        </div>
      </div>
      
      {/* Main Content - Video Grid */}
      <div className="flex-1 flex overflow-hidden">
        <div className={cn("flex-1 transition-all", (showChat || showParticipants) && "sm:pr-0")}>
          <VideoGrid
            key={`video-grid-${streamKey}`}
            participants={allParticipants}
            localStream={displayStream}
            remoteStreams={remoteStreamMap}
            localUserId={user?.id}
            activeSpeaker={currentActiveSpeaker}
            focusedParticipant={focusedParticipant}
            audioLevels={audioLevels}
            onFocusParticipant={setFocusedParticipant}
          />
        </div>
        
        {/* Sidebar - Hidden on mobile, shown on larger screens */}
        {(showChat || showParticipants) && (
          <div className="hidden sm:flex w-80 bg-slate-900 border-l border-white/10 flex-col">
            <div className="flex border-b border-white/10">
              <button
                onClick={() => { setShowChat(true); setShowParticipants(false); }}
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-colors",
                  showChat ? "text-white border-b-2 border-indigo-500" : "text-gray-400 hover:text-white"
                )}
              >
                Chat
              </button>
              <button
                onClick={() => { setShowParticipants(true); setShowChat(false); }}
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-colors",
                  showParticipants ? "text-white border-b-2 border-indigo-500" : "text-gray-400 hover:text-white"
                )}
              >
                Participants ({allParticipants.length})
              </button>
            </div>
            
            {/* Chat Content */}
            {showChat && (
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatMessages.length === 0 && (
                      <p className="text-gray-500 text-center text-sm">No messages yet</p>
                    )}
                    {chatMessages.map(msg => (
                      <div key={msg.id} className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-white">{msg.sender}</span>
                          <span className="text-gray-500 text-xs">{msg.time}</span>
                        </div>
                        <p className="text-gray-300 text-sm">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      className="bg-slate-800 border-slate-700"
                      onKeyPress={e => e.key === 'Enter' && sendChatMessage()}
                    />
                    <Button onClick={sendChatMessage} size="sm">Send</Button>
                  </div>
                </div>
              </>
            )}
            
            {/* Participants Content */}
            {showParticipants && (
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-2">
                  {allParticipants.map(p => (
                    <div 
                      key={p.user_id} 
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors",
                        p.user_id === currentActiveSpeaker && "bg-green-500/10 border border-green-500/30"
                      )}
                      onClick={() => setFocusedParticipant(p.user_id === focusedParticipant ? null : p.user_id)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-indigo-600">
                          {p.user_name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm font-medium">
                            {p.user_name} {p.user_id === user?.id && '(You)'}
                          </p>
                          {isUserSpeaking(p.user_id) && (
                            <AudioLevelIndicator level={audioLevels.get(p.user_id) || 0} isActive={true} />
                          )}
                        </div>
                        {p.user_id === currentActiveSpeaker && (
                          <p className="text-green-400 text-xs">Speaking</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {!p.audio_enabled && <MicOff className="w-4 h-4 text-red-400" />}
                        {!p.video_enabled && <VideoOff className="w-4 h-4 text-red-400" />}
                        {p.hand_raised && <Hand className="w-4 h-4 text-yellow-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
        
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {(showChat || showParticipants) && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed inset-0 z-50 sm:hidden"
            >
              <div className="absolute inset-0 bg-black/50" onClick={() => { setShowChat(false); setShowParticipants(false); }} />
              <motion.div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-slate-900 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <h3 className="text-white font-medium">{showChat ? 'Chat' : 'Participants'}</h3>
                  <Button variant="ghost" size="icon" onClick={() => { setShowChat(false); setShowParticipants(false); }}>
                    <X className="w-5 h-5 text-gray-400" />
                  </Button>
                </div>
                
                {showChat && (
                  <>
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {chatMessages.length === 0 && (
                          <p className="text-gray-500 text-center text-sm">No messages yet</p>
                        )}
                        {chatMessages.map(msg => (
                          <div key={msg.id} className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-white">{msg.sender}</span>
                              <span className="text-gray-500 text-xs">{msg.time}</span>
                            </div>
                            <p className="text-gray-300 text-sm">{msg.message}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="p-4 border-t border-white/10 pb-safe">
                      <div className="flex gap-2">
                        <Input
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          placeholder="Type a message..."
                          className="bg-slate-800 border-slate-700"
                          onKeyPress={e => e.key === 'Enter' && sendChatMessage()}
                        />
                        <Button onClick={sendChatMessage} size="sm">Send</Button>
                      </div>
                    </div>
                  </>
                )}
                
                {showParticipants && (
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-2">
                      {allParticipants.map(p => (
                        <div 
                          key={p.user_id} 
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 active:bg-slate-700 cursor-pointer transition-colors",
                            p.user_id === currentActiveSpeaker && "bg-green-500/10 border border-green-500/30"
                          )}
                          onClick={() => {
                            setFocusedParticipant(p.user_id === focusedParticipant ? null : p.user_id);
                            setShowParticipants(false);
                          }}
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-indigo-600 text-lg">
                              {p.user_name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium">
                                {p.user_name} {p.user_id === user?.id && '(You)'}
                              </p>
                              {isUserSpeaking(p.user_id) && (
                                <AudioLevelIndicator level={audioLevels.get(p.user_id) || 0} isActive={true} />
                              )}
                            </div>
                            {p.user_id === currentActiveSpeaker && (
                              <p className="text-green-400 text-sm">Speaking</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!p.audio_enabled && <MicOff className="w-5 h-5 text-red-400" />}
                            {!p.video_enabled && <VideoOff className="w-5 h-5 text-red-400" />}
                            {p.hand_raised && <Hand className="w-5 h-5 text-yellow-400" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Controls - Mobile optimized */}
      <TooltipProvider>
        <div className="flex items-center justify-center gap-1.5 sm:gap-3 py-3 sm:py-5 px-2 sm:px-6 bg-slate-900 border-t border-white/10 pb-safe">
          {/* Primary Controls - Always visible */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    className={cn(
                      "rounded-xl h-11 w-11 sm:h-14 sm:w-14 shadow-lg transition-all",
                      isAudioEnabled 
                        ? "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600" 
                        : "bg-red-500 hover:bg-red-400 text-white"
                    )}
                    onClick={toggleAudio}
                    data-testid="toggle-mic-btn"
                  >
                    {isAudioEnabled ? <Mic className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </Button>
                  <span className="text-[10px] sm:text-xs text-gray-300 mt-1 sm:mt-1.5 font-medium">{isAudioEnabled ? 'Mute' : 'Unmute'}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>{isAudioEnabled ? 'Turn off microphone' : 'Turn on microphone'}</p></TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    className={cn(
                      "rounded-xl h-11 w-11 sm:h-14 sm:w-14 shadow-lg transition-all",
                      isVideoEnabled 
                        ? "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600" 
                        : "bg-red-500 hover:bg-red-400 text-white"
                    )}
                    onClick={toggleVideo}
                    data-testid="toggle-video-btn"
                  >
                    {isVideoEnabled ? <Video className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </Button>
                  <span className="text-[10px] sm:text-xs text-gray-300 mt-1 sm:mt-1.5 font-medium">{isVideoEnabled ? 'Video' : 'Video'}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>{isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}</p></TooltipContent>
            </Tooltip>
            
            {/* Screen share - Hidden on mobile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden sm:flex flex-col items-center">
                  <Button
                    size="lg"
                    className={cn(
                      "rounded-xl h-14 w-14 shadow-lg transition-all",
                      isScreenSharing 
                        ? "bg-indigo-500 hover:bg-indigo-400 text-white" 
                        : "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                    )}
                    onClick={toggleScreenShare}
                    data-testid="share-screen-btn"
                  >
                    {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                  </Button>
                  <span className="text-xs text-gray-300 mt-1.5 font-medium">{isScreenSharing ? 'Stop' : 'Share'}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>{isScreenSharing ? 'Stop screen sharing' : 'Share your screen'}</p></TooltipContent>
            </Tooltip>
            
            {/* Virtual Background Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    className={cn(
                      "rounded-xl h-11 w-11 sm:h-14 sm:w-14 shadow-lg transition-all relative",
                      virtualBgEnabled && backgroundEffect !== BACKGROUND_EFFECTS.NONE
                        ? "bg-purple-500 hover:bg-purple-400 text-white" 
                        : "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                    )}
                    onClick={() => setShowBackgroundSelector(true)}
                    data-testid="virtual-bg-btn"
                  >
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                    {bgProcessing && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </Button>
                  <span className="text-[10px] sm:text-xs text-gray-300 mt-1 sm:mt-1.5 font-medium">Effects</span>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Virtual backgrounds & blur</p></TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    className={cn(
                      "rounded-xl h-11 w-11 sm:h-14 sm:w-14 shadow-lg transition-all",
                      handRaised 
                        ? "bg-yellow-500 hover:bg-yellow-400 text-white" 
                        : "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                    )}
                    onClick={toggleHandRaise}
                    data-testid="raise-hand-btn"
                  >
                    <Hand className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>
                  <span className="text-[10px] sm:text-xs text-gray-300 mt-1 sm:mt-1.5 font-medium">{handRaised ? 'Lower' : 'Raise'}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>{handRaised ? 'Lower your hand' : 'Raise your hand'}</p></TooltipContent>
            </Tooltip>
          </div>
          
          {/* Center - End Call */}
          <div className="mx-2 sm:mx-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    className="rounded-xl h-11 sm:h-14 px-4 sm:px-8 bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30 font-semibold"
                    onClick={leaveMeeting}
                    data-testid="leave-meeting-btn"
                  >
                    <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                    <span className="hidden sm:inline">Leave</span>
                  </Button>
                  <span className="text-[10px] sm:hidden text-gray-300 mt-1 font-medium">Leave</span>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Leave meeting</p></TooltipContent>
            </Tooltip>
          </div>
          
          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    className={cn(
                      "rounded-xl h-11 w-11 sm:h-14 sm:w-14 shadow-lg transition-all",
                      showParticipants 
                        ? "bg-indigo-500 hover:bg-indigo-400 text-white" 
                        : "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                    )}
                    onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
                    data-testid="participants-btn"
                  >
                    <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>
                  <span className="text-[10px] sm:text-xs text-gray-300 mt-1 sm:mt-1.5 font-medium">People</span>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>View participants</p></TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    className={cn(
                      "rounded-xl h-11 w-11 sm:h-14 sm:w-14 shadow-lg transition-all",
                      showChat 
                        ? "bg-indigo-500 hover:bg-indigo-400 text-white" 
                        : "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                    )}
                    onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
                    data-testid="chat-btn"
                  >
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>
                  <span className="text-[10px] sm:text-xs text-gray-300 mt-1 sm:mt-1.5 font-medium">Chat</span>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Open meeting chat</p></TooltipContent>
            </Tooltip>
            
            {/* Grid button - Hidden on mobile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden sm:flex flex-col items-center">
                  <Button
                    size="lg"
                    className={cn(
                      "rounded-xl h-14 w-14 shadow-lg transition-all",
                      focusedParticipant 
                        ? "bg-indigo-500 hover:bg-indigo-400 text-white" 
                        : "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                    )}
                    onClick={() => setFocusedParticipant(null)}
                    data-testid="grid-view-btn"
                  >
                    <Grid className="w-6 h-6" />
                  </Button>
                  <span className="text-xs text-gray-300 mt-1.5 font-medium">Grid</span>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Reset to grid view</p></TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
      
      {/* Virtual Background Selector Modal */}
      <VirtualBackgroundSelector
        isOpen={showBackgroundSelector}
        onClose={() => setShowBackgroundSelector(false)}
        currentEffect={backgroundEffect}
        currentBackground={selectedBackground}
        onEffectChange={(effect) => {
          setBackgroundEffect(effect);
          setVirtualBgEnabled(effect !== BACKGROUND_EFFECTS.NONE);
        }}
        onBackgroundChange={setSelectedBackground}
        isLoading={bgLoading}
        isProcessing={bgProcessing}
        fps={bgFps}
        modelReady={bgModelReady}
        disabled={!isVideoEnabled}
      />
    </div>
  );
};

export default GroupMeetingRoomPage;
