import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, Users, 
  MessageSquare, Monitor, MonitorOff, Copy, Check, Clock, Calendar,
  Hand, MoreHorizontal, Grid, Maximize2, Pin, Volume2, Image as ImageIcon
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
import { getApiUrl, API_URL } from '@/lib/api';
import BackgroundButton from '@/components/video/BackgroundButton';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Participant Video Tile Component
const ParticipantTile = ({ participant, isLocal, isSpeaking, isPinned, onPin, stream }) => {
  const videoRef = useRef(null);
  
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "relative bg-slate-800 rounded-xl overflow-hidden group",
        isSpeaking && "ring-2 ring-green-500 ring-offset-2 ring-offset-slate-900",
        isPinned && "col-span-2 row-span-2"
      )}
    >
      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={cn(
          "w-full h-full object-cover",
          !participant.video_enabled && "hidden"
        )}
      />
      
      {/* Avatar when video is off */}
      {!participant.video_enabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
          <Avatar className={cn("transition-all", isPinned ? "h-24 w-24" : "h-16 w-16")}>
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-2xl">
              {participant.user_name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            <Volume2 className="w-3 h-3 animate-pulse" />
            Speaking
          </div>
        </div>
      )}
      
      {/* Name and status overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium truncate">
              {participant.user_name} {isLocal && '(You)'}
            </span>
            {!participant.audio_enabled && (
              <MicOff className="w-4 h-4 text-red-400" />
            )}
          </div>
          
          {/* Pin button (hidden by default, shown on hover) */}
          <button
            onClick={() => onPin?.(participant.user_id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/20 rounded"
          >
            <Pin className={cn("w-4 h-4", isPinned ? "text-violet-400" : "text-white")} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const GroupMeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Meeting state
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [pinnedParticipant, setPinnedParticipant] = useState(null);
  
  // Local media state
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  
  // UI state
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid or speaker
  
  // Refs
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const remoteStreamsRef = useRef({});
  const eventSourceRef = useRef(null);
  // Auto-recording refs
  const autoRecorderRef = useRef(null);
  const autoChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const mixedDestRef = useRef(null);

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Load meeting details
  useEffect(() => {
    const loadMeeting = async () => {
      try {
        const response = await fetch(`${API_URL}/api/calendar/events/${meetingId}`);
        if (response.ok) {
          const data = await response.json();
          setMeeting(data);
        } else {
          // Create instant meeting data
          setMeeting({
            id: meetingId,
            title: 'Group Meeting',
            description: 'Video conference',
            start_time: new Date().toISOString(),
            isInstant: true
          });
        }
      } catch (err) {
        console.error('Error loading meeting:', err);
        setMeeting({
          id: meetingId,
          title: 'Group Meeting',
          isInstant: true
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (meetingId) loadMeeting();
  }, [meetingId]);

  // Start camera preview
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play();
        setVideoPlaying(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      toast({
        variant: 'destructive',
        title: 'Camera access denied',
        description: 'Please allow camera access to join with video'
      });
    }
  };

  // Setup SSE for signaling
  const setupSignaling = useCallback(() => {
    if (!user?.id) return;
    
    const eventSource = new EventSource(`${API_URL}/api/chat/stream/${user.id}`);
    eventSourceRef.current = eventSource;
    
    eventSource.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'participant_joined':
            if (data.data.meeting_id === meetingId) {
              handleNewParticipant(data.data.participant);
            }
            break;
            
          case 'participant_left':
            if (data.data.meeting_id === meetingId) {
              handleParticipantLeft(data.data.user_id);
            }
            break;
            
          case 'participant_status_changed':
            if (data.data.meeting_id === meetingId) {
              handleParticipantStatusChange(data.data);
            }
            break;
            
          case 'webrtc_offer':
            if (data.data.meeting_id === meetingId) {
              await handleWebRTCOffer(data.data);
            }
            break;
            
          case 'webrtc_answer':
            if (data.data.meeting_id === meetingId) {
              await handleWebRTCAnswer(data.data);
            }
            break;
            
          case 'webrtc_ice_candidate':
            if (data.data.meeting_id === meetingId) {
              await handleICECandidate(data.data);
            }
            break;
        }
      } catch (err) {
        console.error('SSE message error:', err);
      }
    };
    
    return () => {
      eventSource.close();
    };
  }, [user?.id, meetingId]);

  // Handle new participant joining
  const handleNewParticipant = async (participant) => {
    console.log('New participant joined:', participant);
    
    setParticipants(prev => {
      if (prev.find(p => p.user_id === participant.user_id)) return prev;
      return [...prev, participant];
    });
    
    // Create peer connection for new participant
    await createPeerConnection(participant.user_id, true);
  };

  // Handle participant leaving
  const handleParticipantLeft = (userId) => {
    console.log('Participant left:', userId);
    
    setParticipants(prev => prev.filter(p => p.user_id !== userId));
    
    // Close peer connection
    if (peerConnectionsRef.current[userId]) {
      peerConnectionsRef.current[userId].close();
      delete peerConnectionsRef.current[userId];
    }
    
    // Remove remote stream
    if (remoteStreamsRef.current[userId]) {
      delete remoteStreamsRef.current[userId];
    }
  };

  // Handle participant status change
  const handleParticipantStatusChange = (data) => {
    setParticipants(prev => prev.map(p => 
      p.user_id === data.user_id 
        ? { ...p, audio_enabled: data.audio_enabled, video_enabled: data.video_enabled, is_speaking: data.is_speaking }
        : p
    ));
  };

  // Create WebRTC peer connection
  const createPeerConnection = async (targetUserId, initiator = false) => {
    if (peerConnectionsRef.current[targetUserId]) return;
    
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionsRef.current[targetUserId] = pc;
    
    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(targetUserId, 'ice_candidate', { candidate: event.candidate });
      }
    };
    
    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote track from:', targetUserId);
      remoteStreamsRef.current[targetUserId] = event.streams[0];
      // Add remote audio to auto-recording mixer
      try {
        if (audioContextRef.current && mixedDestRef.current && event.streams[0].getAudioTracks().length > 0) {
          audioContextRef.current.createMediaStreamSource(event.streams[0]).connect(mixedDestRef.current);
          console.log(`[AutoRecord] Added remote audio from ${targetUserId}`);
        }
      } catch (err) {
        console.warn('[AutoRecord] Failed to add remote audio:', err);
      }
      // Force re-render
      setParticipants(prev => [...prev]);
    };
    
    // If initiator, create and send offer
    if (initiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal(targetUserId, 'offer', { offer });
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    }
  };

  // Handle WebRTC offer
  const handleWebRTCOffer = async (data) => {
    const { from_user_id, offer } = data;
    
    await createPeerConnection(from_user_id, false);
    const pc = peerConnectionsRef.current[from_user_id];
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal(from_user_id, 'answer', { answer });
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  };

  // Handle WebRTC answer
  const handleWebRTCAnswer = async (data) => {
    const { from_user_id, answer } = data;
    const pc = peerConnectionsRef.current[from_user_id];
    
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    }
  };

  // Handle ICE candidate
  const handleICECandidate = async (data) => {
    const { from_user_id, candidate } = data;
    const pc = peerConnectionsRef.current[from_user_id];
    
    if (pc && candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    }
  };

  // Send WebRTC signal
  const sendSignal = async (toUserId, signalType, signalData) => {
    try {
      await fetch(`${API_URL}/api/meeting-room/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: meetingId,
          from_user_id: user.id,
          to_user_id: toUserId,
          signal_type: signalType,
          signal_data: signalData
        })
      });
    } catch (err) {
      console.error('Error sending signal:', err);
    }
  };

  // Join meeting room
  const joinMeeting = async () => {
    if (!localStreamRef.current) {
      await startCamera();
    }
    
    try {
      const response = await fetch(`${API_URL}/api/meeting-room/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: meetingId,
          user_id: user.id,
          user_name: user.name || 'Guest',
          audio_enabled: isAudioEnabled,
          video_enabled: isVideoEnabled
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Add self to participants
        setParticipants([data.participant, ...data.other_participants]);
        
        // Setup signaling
        setupSignaling();
        
        // Create peer connections for existing participants
        for (const participant of data.other_participants) {
          await createPeerConnection(participant.user_id, true);
        }
        
        setJoined(true);
        setCallStartTime(Date.now());
        
        // Start auto-recording all audio for transcription
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          audioContextRef.current = ctx;
          const dest = ctx.createMediaStreamDestination();
          mixedDestRef.current = dest;
          if (localStreamRef.current?.getAudioTracks().length > 0) {
            ctx.createMediaStreamSource(localStreamRef.current).connect(dest);
          }
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
          const recorder = new MediaRecorder(dest.stream, { mimeType });
          autoChunksRef.current = [];
          recorder.ondataavailable = (e) => {
            if (e.data?.size > 0) autoChunksRef.current.push(e.data);
          };
          recorder.start(1000);
          autoRecorderRef.current = recorder;
          console.log('[AutoRecord] Started recording all audio');
        } catch (e) {
          console.warn('[AutoRecord] Failed to start:', e);
        }
        
        toast({
          title: 'Joined meeting',
          description: `${data.total_participants} participant(s) in the room`
        });
      }
    } catch (err) {
      console.error('Error joining meeting:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to join meeting'
      });
    }
  };

  // Leave meeting
  const leaveMeeting = async () => {
    // Stop auto-recording and collect audio
    let audioBlob = null;
    try {
      if (autoRecorderRef.current && autoRecorderRef.current.state !== 'inactive') {
        autoRecorderRef.current.stop();
        await new Promise(resolve => {
          autoRecorderRef.current.onstop = resolve;
          setTimeout(resolve, 500);
        });
      }
      if (autoChunksRef.current.length > 0) {
        const mimeType = autoRecorderRef.current?.mimeType || 'audio/webm';
        audioBlob = new Blob(autoChunksRef.current, { type: mimeType });
        console.log(`[AutoRecord] Captured ${(audioBlob.size / 1024).toFixed(0)}KB of audio`);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    } catch (e) {
      console.warn('[AutoRecord] Error stopping:', e);
    }

    try {
      await fetch(`${API_URL}/api/meeting-room/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: meetingId,
          user_id: user.id
        })
      });
    } catch (err) {
      console.error('Error leaving meeting:', err);
    }
    
    // Cleanup
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    // Navigate to processing page if we have audio
    const durationSec = callStartTime ? Math.round((Date.now() - callStartTime) / 1000) : 0;
    if (audioBlob && audioBlob.size > 5000 && durationSec >= 10) {
      window.__meetingAudioBlob = audioBlob;
      window.__meetingAudioMeta = {
        userId: user?.id,
        title: meeting?.title || `Meeting ${meetingId.slice(0, 8)}`,
        participants: participants.map(p => p.user_name || p.user_id),
        durationSeconds: durationSec,
      };
      navigate(`/meeting/${meetingId}/processing?title=${encodeURIComponent(meeting?.title || `Meeting ${meetingId.slice(0, 8)}`)}`);
    } else {
      navigate('/meetings');
    }
  };

  // Toggle audio
  const toggleAudio = async () => {
    if (localStreamRef.current) {
      const newState = !isAudioEnabled;
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = newState;
      });
      setIsAudioEnabled(newState);
      
      // Notify other participants
      await fetch(`${API_URL}/api/meeting-room/${meetingId}/update-status?user_id=${user.id}&audio_enabled=${newState}`, {
        method: 'POST'
      });
    }
  };

  // Toggle video
  const toggleVideo = async () => {
    if (localStreamRef.current) {
      const newState = !isVideoEnabled;
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = newState;
      });
      setIsVideoEnabled(newState);
      
      // Notify other participants
      await fetch(`${API_URL}/api/meeting-room/${meetingId}/update-status?user_id=${user.id}&video_enabled=${newState}`, {
        method: 'POST'
      });
    }
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
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        
        // Replace video track in all peer connections
        const videoTrack = screenStream.getVideoTracks()[0];
        Object.values(peerConnectionsRef.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
        
        videoTrack.onended = () => {
          toggleScreenShare();
        };
        
        setIsScreenSharing(true);
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

  // Calculate grid layout
  const getGridClass = () => {
    const count = participants.length;
    if (count <= 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    if (count <= 9) return 'grid-cols-3';
    if (count <= 12) return 'grid-cols-4';
    return 'grid-cols-4';
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Pre-join screen
  if (!joined) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
          <Helmet><title>Join Meeting | Munal AI</title></Helmet>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full"
          >
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
              {/* Meeting Info */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-white">{meeting?.title || 'Group Meeting'}</h1>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    Up to 16 participants
                  </Badge>
                </div>
                <p className="text-gray-400 text-sm">Meeting ID: {meetingId}</p>
              </div>

              {/* Video Preview */}
              <div className="p-6">
                <div className="relative aspect-video bg-slate-800 rounded-2xl overflow-hidden mb-6">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                      "w-full h-full object-cover",
                      !isVideoEnabled && "hidden"
                    )}
                  />
                  {(!isVideoEnabled || !videoPlaying) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                      <div className="text-center">
                        <Avatar className="h-24 w-24 mx-auto mb-4">
                          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-3xl">
                            {user?.name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <Button onClick={startCamera} className="bg-violet-600 hover:bg-violet-700">
                          <Video className="w-4 h-4 mr-2" />
                          Enable Camera
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-2">
                        <Button
                          size="lg"
                          className={cn(
                            "rounded-full h-16 w-16 shadow-lg",
                            isAudioEnabled 
                              ? "bg-slate-600 hover:bg-slate-500 text-white" 
                              : "bg-red-500 hover:bg-red-400 text-white"
                          )}
                          onClick={toggleAudio}
                        >
                          {isAudioEnabled ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
                        </Button>
                        <span className="text-sm text-white">{isAudioEnabled ? 'Mute' : 'Unmute'}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Toggle microphone</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-2">
                        <Button
                          size="lg"
                          className={cn(
                            "rounded-full h-16 w-16 shadow-lg",
                            isVideoEnabled 
                              ? "bg-slate-600 hover:bg-slate-500 text-white" 
                              : "bg-red-500 hover:bg-red-400 text-white"
                          )}
                          onClick={toggleVideo}
                        >
                          {isVideoEnabled ? <Video className="w-7 h-7" /> : <VideoOff className="w-7 h-7" />}
                        </Button>
                        <span className="text-sm text-white">{isVideoEnabled ? 'Stop' : 'Start'}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Toggle camera</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-2">
                        <BackgroundButton className="rounded-full h-16 w-16 shadow-lg" />
                        <span className="text-sm text-white">Background</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Virtual background</TooltipContent>
                  </Tooltip>
                </div>

                {/* Join Button */}
                <div className="flex gap-3">
                  <Button
                    onClick={joinMeeting}
                    className="flex-1 h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-lg font-semibold"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Join Meeting
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" className="h-12 border-slate-600" onClick={copyMeetingLink}>
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy meeting link</TooltipContent>
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
  const speakingParticipant = participants.find(p => p.is_speaking);
  const displayParticipants = viewMode === 'speaker' && speakingParticipant
    ? [speakingParticipant, ...participants.filter(p => p.user_id !== speakingParticipant.user_id)]
    : participants;

  return (
    <div className="h-screen bg-slate-950 flex flex-col">
      <Helmet><title>{meeting?.title || 'Group Meeting'} | Munal AI</title></Helmet>
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-white/10">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">{meeting?.title || 'Group Meeting'}</h1>
          <Badge variant="secondary" className="bg-red-500/20 text-red-400">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
            {formatDuration(callDuration)}
          </Badge>
          <Badge variant="secondary" className="bg-green-500/20 text-green-400">
            <Users className="w-3 h-3 mr-1" />
            {participants.length} / 16
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="text-gray-400"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'speaker' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('speaker')}
            className="text-gray-400"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={copyMeetingLink} className="text-gray-400 hover:text-white">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            Invite
          </Button>
        </div>
      </div>

      {/* Main Content - Video Grid */}
      <div className="flex-1 flex overflow-hidden">
        <div className={cn("flex-1 p-4", (showChat || showParticipants) && "pr-0")}>
          <div className={cn(
            "h-full grid gap-2 auto-rows-fr",
            viewMode === 'speaker' && speakingParticipant ? 'grid-cols-4' : getGridClass()
          )}>
            <AnimatePresence>
              {displayParticipants.map((participant, index) => (
                <ParticipantTile
                  key={participant.user_id}
                  participant={participant}
                  isLocal={participant.user_id === user?.id}
                  isSpeaking={participant.is_speaking}
                  isPinned={pinnedParticipant === participant.user_id || (viewMode === 'speaker' && index === 0)}
                  onPin={(id) => setPinnedParticipant(pinnedParticipant === id ? null : id)}
                  stream={participant.user_id === user?.id ? localStreamRef.current : remoteStreamsRef.current[participant.user_id]}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar */}
        {(showChat || showParticipants) && (
          <div className="w-80 bg-slate-900 border-l border-white/10 flex flex-col">
            <div className="flex border-b border-white/10">
              <button
                onClick={() => { setShowChat(true); setShowParticipants(false); }}
                className={cn(
                  "flex-1 py-3 text-sm font-medium",
                  showChat ? "text-white border-b-2 border-violet-500" : "text-gray-400"
                )}
              >
                Chat
              </button>
              <button
                onClick={() => { setShowParticipants(true); setShowChat(false); }}
                className={cn(
                  "flex-1 py-3 text-sm font-medium",
                  showParticipants ? "text-white border-b-2 border-violet-500" : "text-gray-400"
                )}
              >
                Participants ({participants.length})
              </button>
            </div>

            {showParticipants && (
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-2">
                  {participants.map(p => (
                    <div key={p.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-violet-600">{p.user_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">
                          {p.user_name} {p.user_id === user?.id && '(You)'}
                        </p>
                        {p.is_speaking && (
                          <span className="text-xs text-green-400">Speaking</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {!p.audio_enabled && <MicOff className="w-4 h-4 text-red-400" />}
                        {!p.video_enabled && <VideoOff className="w-4 h-4 text-red-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {showChat && (
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatMessages.map(msg => (
                      <div key={msg.id} className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-white">{msg.sender}</span>
                          <span className="text-gray-500 text-xs">{msg.time}</span>
                        </div>
                        <p className="text-gray-300 text-sm">{msg.message}</p>
                      </div>
                    ))}
                    {chatMessages.length === 0 && (
                      <p className="text-gray-500 text-center">No messages yet</p>
                    )}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      className="bg-slate-800 border-slate-700"
                    />
                    <Button size="sm">Send</Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <TooltipProvider>
        <div className="flex items-center justify-center gap-3 py-4 px-6 bg-slate-900 border-t border-white/10">
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    className={cn(
                      "rounded-xl h-14 w-14 shadow-lg",
                      isAudioEnabled ? "bg-slate-700 hover:bg-slate-600" : "bg-red-500 hover:bg-red-400"
                    )}
                    onClick={toggleAudio}
                  >
                    {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                  </Button>
                  <span className="text-xs text-gray-300 mt-1.5">{isAudioEnabled ? 'Mute' : 'Unmute'}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Toggle microphone</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    className={cn(
                      "rounded-xl h-14 w-14 shadow-lg",
                      isVideoEnabled ? "bg-slate-700 hover:bg-slate-600" : "bg-red-500 hover:bg-red-400"
                    )}
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                  </Button>
                  <span className="text-xs text-gray-300 mt-1.5">{isVideoEnabled ? 'Stop' : 'Start'}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Toggle camera</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    className={cn(
                      "rounded-xl h-14 w-14 shadow-lg",
                      isScreenSharing ? "bg-violet-500 hover:bg-violet-400" : "bg-slate-700 hover:bg-slate-600"
                    )}
                    onClick={toggleScreenShare}
                  >
                    {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                  </Button>
                  <span className="text-xs text-gray-300 mt-1.5">Share</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Share screen</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <BackgroundButton className="rounded-xl h-14 w-14 shadow-lg" />
                  <span className="text-xs text-gray-300 mt-1.5">Background</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Virtual background</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    className={cn(
                      "rounded-xl h-14 w-14 shadow-lg",
                      handRaised ? "bg-yellow-500 hover:bg-yellow-400" : "bg-slate-700 hover:bg-slate-600"
                    )}
                    onClick={() => setHandRaised(!handRaised)}
                  >
                    <Hand className="w-6 h-6" />
                  </Button>
                  <span className="text-xs text-gray-300 mt-1.5">Raise</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Raise hand</TooltipContent>
            </Tooltip>
          </div>

          <div className="mx-6">
            <Button
              size="lg"
              className="rounded-xl h-14 px-8 bg-red-500 hover:bg-red-400 text-white shadow-lg"
              onClick={leaveMeeting}
            >
              <PhoneOff className="w-5 h-5 mr-2" />
              Leave
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    className={cn(
                      "rounded-xl h-14 w-14 shadow-lg",
                      showParticipants ? "bg-violet-500" : "bg-slate-700 hover:bg-slate-600"
                    )}
                    onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
                  >
                    <Users className="w-6 h-6" />
                  </Button>
                  <span className="text-xs text-gray-300 mt-1.5">People</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Participants</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    className={cn(
                      "rounded-xl h-14 w-14 shadow-lg",
                      showChat ? "bg-violet-500" : "bg-slate-700 hover:bg-slate-600"
                    )}
                    onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
                  >
                    <MessageSquare className="w-6 h-6" />
                  </Button>
                  <span className="text-xs text-gray-300 mt-1.5">Chat</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Chat</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default GroupMeetingRoom;
