import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, Users, 
  MessageSquare, Monitor, Copy, Check, Clock, Grid,
  Settings, Maximize2, X, Share2, Circle, Square, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

// Simple Video Tile Component
const VideoTile = ({ stream, name, isLocal, isMuted, isVideoOff, isLarge }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  const initials = name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';

  return (
    <div 
      className={cn(
        "relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/50",
        isLarge ? "aspect-video" : "aspect-video min-h-[200px]"
      )}
      data-testid={`video-tile-${isLocal ? 'local' : 'remote'}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={cn(
          "absolute inset-0 w-full h-full object-cover",
          isLocal && "transform scale-x-[-1]",
          isVideoOff && "hidden"
        )}
      />

      {/* Avatar when video is off */}
      {isVideoOff && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl sm:text-3xl">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Overlay with name and status */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-medium">
            {name} {isLocal && '(You)'}
          </span>
          <div className="flex items-center gap-2">
            {isMuted && (
              <span className="bg-red-500 p-1 rounded-full">
                <MicOff className="w-3 h-3 text-white" />
              </span>
            )}
            {isVideoOff && (
              <span className="bg-red-500 p-1 rounded-full">
                <VideoOff className="w-3 h-3 text-white" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Instant Meeting Room Component
const InstantMeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Core states
  const [joined, setJoined] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  
  // UI states
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [copied, setCopied] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const mediaRecorderRef = useRef(null);
  const recordingStartRef = useRef(null);

  // Refs (only for non-render values)
  const previewRef = useRef(null);
  const callStartRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());

  // ICE servers config - defined outside component to avoid recreating
  const iceServersConfig = React.useMemo(() => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }), []);

  // Initialize camera for preview
  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true
      });
      setLocalStream(stream);
      
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.play().catch(() => {});
      }
      
      return stream;
    } catch (err) {
      console.error('Camera error:', err);
      toast({ 
        variant: 'destructive', 
        title: 'Camera Access Error',
        description: err.name === 'NotAllowedError' 
          ? 'Please allow camera and microphone access' 
          : 'Could not access camera'
      });
      return null;
    }
  }, [toast]);

  // Start preview on mount
  useEffect(() => {
    let isMounted = true;
    
    const startPreview = async () => {
      if (!joined && isMounted) {
        await initCamera();
      }
    };
    
    startPreview();
    
    return () => {
      isMounted = false;
    };
  }, [joined, initCamera]);

  // Cleanup streams on unmount
  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach(t => t.stop());
    };
  }, [localStream]);

  // Call duration timer
  useEffect(() => {
    let interval;
    if (joined && callStartRef.current) {
      interval = setInterval(() => {
        const elapsed = Math.floor((performance.now() - callStartRef.current) / 1000);
        setCallDuration(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [joined]);

  // Recording duration timer
  useEffect(() => {
    let interval;
    if (isRecording && recordingStartRef.current) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartRef.current) / 1000);
        setRecordingDuration(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Create peer connection for a participant
  const createPeerConnection = useCallback((participantId, participantName, isInitiator) => {
    if (peerConnectionsRef.current.has(participantId)) {
      return peerConnectionsRef.current.get(participantId);
    }

    const pc = new RTCPeerConnection(iceServersConfig);
    peerConnectionsRef.current.set(participantId, pc);

    // Add local tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = async (e) => {
      if (e.candidate) {
        try {
          await fetch(`${API_URL}/api/group-call/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              room_id: meetingId,
              sender_id: user?.id,
              sender_name: user?.name,
              target_id: participantId,
              signal_type: 'ice_candidate',
              signal_data: { candidate: e.candidate }
            })
          });
        } catch (err) {
          console.error('ICE candidate send error:', err);
        }
      }
    };

    // Handle remote tracks
    pc.ontrack = (e) => {
      if (e.streams[0]) {
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.set(participantId, e.streams[0]);
          return newMap;
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Peer ${participantId} state:`, pc.connectionState);
    };

    return pc;
  }, [localStream, meetingId, user, iceServersConfig]);

  // Join meeting
  const joinMeeting = async () => {
    let stream = localStream;
    
    if (!stream) {
      stream = await initCamera();
      if (!stream) return;
    }

    // Ensure tracks match UI state
    stream.getVideoTracks().forEach(t => t.enabled = isVideoEnabled);
    stream.getAudioTracks().forEach(t => t.enabled = isAudioEnabled);
    setLocalStream(stream);

    try {
      // Join room on server
      const res = await fetch(`${API_URL}/api/group-call/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: meetingId,
          user_id: user?.id,
          user_name: user?.name || 'Anonymous',
          video_enabled: isVideoEnabled,
          audio_enabled: isAudioEnabled
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setParticipants(data.room.participants);
        setJoined(true);
        
        // Set call start time after state update
        setTimeout(() => {
          callStartRef.current = performance.now();
        }, 0);

        // Connect to existing participants
        const others = data.room.participants.filter(p => p.user_id !== user?.id);
        for (const p of others) {
          await createOfferTo(p.user_id, p.user_name);
        }

        // Signaling is handled by global SSE via window.__groupCallHandler

        toast({ title: 'Joined Meeting', description: `Room: ${meetingId}` });
      }
    } catch (err) {
      console.error('Join error:', err);
      toast({ variant: 'destructive', title: 'Failed to join meeting' });
    }
  };

  // Create and send offer
  const createOfferTo = useCallback(async (participantId, participantName) => {
    const pc = createPeerConnection(participantId, participantName, true);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await fetch(`${API_URL}/api/group-call/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: meetingId,
          sender_id: user?.id,
          sender_name: user?.name,
          target_id: participantId,
          signal_type: 'offer',
          signal_data: { offer: pc.localDescription }
        })
      });
    } catch (err) {
      console.error('Offer error:', err);
    }
  }, [createPeerConnection, meetingId, user]);

  // Handle incoming signals via global handler (from SSE)
  const handleGroupCallSignal = useCallback(async ({ type, data }) => {
    console.log('[Meeting] Group call signal:', type, data);
    
    // Only handle signals for our room
    if (data.room_id !== meetingId) return;

    if (type === 'participant_joined') {
      const { participant } = data;
      setParticipants(prev => {
        if (!prev.find(p => p.user_id === participant.user_id)) {
          toast({ title: `${participant.user_name} joined` });
          // Create offer to new participant
          createOfferTo(participant.user_id, participant.user_name);
          return [...prev, participant];
        }
        return prev;
      });
    } else if (type === 'participant_left') {
      const { user_id } = data;
      setParticipants(prev => {
        const p = prev.find(p => p.user_id === user_id);
        if (p) toast({ title: `${p.user_name} left` });
        return prev.filter(p => p.user_id !== user_id);
      });
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(user_id);
        return newMap;
      });
      peerConnectionsRef.current.get(user_id)?.close();
      peerConnectionsRef.current.delete(user_id);
    } else if (type === 'participant_updated') {
      const { user_id, updates } = data;
      setParticipants(prev => prev.map(p => 
        p.user_id === user_id ? { ...p, ...updates } : p
      ));
    } else if (type === 'signal') {
      const { sender_id, sender_name, signal_type, signal_data } = data;
      
      if (signal_type === 'offer') {
        const pc = createPeerConnection(sender_id, sender_name, false);
        await pc.setRemoteDescription(new RTCSessionDescription(signal_data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await fetch(`${API_URL}/api/group-call/signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room_id: meetingId,
            sender_id: user?.id,
            sender_name: user?.name,
            target_id: sender_id,
            signal_type: 'answer',
            signal_data: { answer: pc.localDescription }
          })
        });
      } else if (signal_type === 'answer') {
        const pc = peerConnectionsRef.current.get(sender_id);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal_data.answer));
        }
      } else if (signal_type === 'ice_candidate') {
        const pc = peerConnectionsRef.current.get(sender_id);
        if (pc && signal_data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal_data.candidate));
        }
      }
    }
  }, [meetingId, user, createPeerConnection, createOfferTo, toast]);

  // Setup global handler for group call signals
  useEffect(() => {
    window.__groupCallHandler = handleGroupCallSignal;
    return () => {
      window.__groupCallHandler = null;
    };
  }, [handleGroupCallSignal]);

  // Leave meeting
  const leaveMeeting = async () => {
    // Close peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();

    // Stop streams
    localStream?.getTracks().forEach(t => t.stop());
    screenStream?.getTracks().forEach(t => t.stop());

    // Notify server
    try {
      await fetch(`${API_URL}/api/group-call/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: meetingId, user_id: user?.id })
      });
    } catch (err) {
      console.error('Leave error:', err);
    }

    navigate('/meetings');
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => {
        t.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => {
        t.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  // Toggle screen share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen share
      screenStream?.getTracks().forEach(t => t.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
      
      // Replace tracks with camera
      if (localStream) {
        peerConnectionsRef.current.forEach(pc => {
          const videoSender = pc.getSenders().find(s => s.track?.kind === 'video');
          const cameraTrack = localStream.getVideoTracks()[0];
          if (videoSender && cameraTrack) {
            videoSender.replaceTrack(cameraTrack);
          }
        });
      }
    } else {
      try {
        const newScreenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(newScreenStream);
        setIsScreenSharing(true);

        const screenTrack = newScreenStream.getVideoTracks()[0];
        
        // Replace video track in all connections
        peerConnectionsRef.current.forEach(pc => {
          const videoSender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        });

        // Handle screen share stop
        screenTrack.onended = () => {
          setScreenStream(null);
          setIsScreenSharing(false);
          // Restore camera track
          if (localStream) {
            peerConnectionsRef.current.forEach(pc => {
              const videoSender = pc.getSenders().find(s => s.track?.kind === 'video');
              const cameraTrack = localStream.getVideoTracks()[0];
              if (videoSender && cameraTrack) {
                videoSender.replaceTrack(cameraTrack);
              }
            });
          }
        };
      } catch (err) {
        console.error('Screen share error:', err);
        toast({ variant: 'destructive', title: 'Screen share failed' });
      }
    }
  };

  // Copy meeting link
  const copyLink = () => {
    const link = `${window.location.origin}/meeting/${meetingId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Link Copied!' });
  };

  // Start recording
  const startRecording = async () => {
    try {
      // Create a canvas to combine all video streams
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      
      // Get the stream to record (local + screen if sharing)
      const streamToRecord = isScreenSharing && screenStream ? screenStream : localStream;
      
      if (!streamToRecord) {
        toast({ variant: 'destructive', title: 'No stream to record' });
        return;
      }

      // Create a combined stream with canvas video + local audio
      const canvasStream = canvas.captureStream(30);
      const audioTracks = streamToRecord.getAudioTracks();
      audioTracks.forEach(track => canvasStream.addTrack(track));

      // Draw video frames to canvas
      const videoElement = document.createElement('video');
      videoElement.srcObject = streamToRecord;
      videoElement.muted = true;
      await videoElement.play();

      const drawFrame = () => {
        if (isRecording) {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(drawFrame);
        }
      };

      // Initialize MediaRecorder
      const chunks = [];
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      
      // Fallback to other codecs if vp9 not supported
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }

      const recorder = new MediaRecorder(canvasStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          setRecordedChunks(prev => [...prev, e.data]);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `meeting-${meetingId}-${new Date().toISOString().slice(0,10)}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({ title: 'Recording Saved', description: 'Your recording has been downloaded.' });
      };

      recorder.start(1000); // Collect data every second
      recordingStartRef.current = Date.now();
      setIsRecording(true);
      setRecordingDuration(0);
      drawFrame();
      
      toast({ title: 'Recording Started', description: 'Your meeting is being recorded.' });
    } catch (err) {
      console.error('Recording error:', err);
      toast({ variant: 'destructive', title: 'Recording Failed', description: err.message });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingDuration(0);
      recordingStartRef.current = null;
    }
  };

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Send chat message
  const sendChat = () => {
    if (!chatInput.trim()) return;
    
    const msg = {
      id: Date.now(),
      sender: user?.name || 'You',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages(prev => [...prev, msg]);
    setChatInput('');
    
    // TODO: Broadcast to other participants via signaling
  };

  // Get all video tiles to display - useMemo for proper reactive behavior
  const allParticipants = React.useMemo(() => [
    { 
      user_id: user?.id, 
      user_name: user?.name || 'You', 
      isLocal: true,
      stream: isScreenSharing ? screenStream : localStream 
    },
    ...participants
      .filter(p => p.user_id !== user?.id)
      .map(p => ({ 
        ...p, 
        isLocal: false, 
        stream: remoteStreams.get(p.user_id) 
      }))
  ], [user, isScreenSharing, screenStream, localStream, participants, remoteStreams]);

  // Pre-join screen
  if (!joined) {
    return (
      <>
        <Helmet>
          <title>Join Meeting | Munal</title>
        </Helmet>
        
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl"
          >
            {/* Preview Card */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl">
              {/* Video Preview */}
              <div className="relative aspect-video bg-slate-900">
                <video
                  ref={previewRef}
                  autoPlay
                  playsInline
                  muted
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover transform scale-x-[-1]",
                    !isVideoEnabled && "hidden"
                  )}
                />
                
                {!isVideoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Avatar className="h-28 w-28">
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-4xl">
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}

                {/* Preview Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                  <Button
                    variant={isAudioEnabled ? "secondary" : "destructive"}
                    size="lg"
                    className="rounded-full w-14 h-14"
                    onClick={() => {
                      localStream?.getAudioTracks().forEach(t => t.enabled = !isAudioEnabled);
                      setIsAudioEnabled(!isAudioEnabled);
                    }}
                    data-testid="preview-mic-toggle"
                  >
                    {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                  </Button>
                  
                  <Button
                    variant={isVideoEnabled ? "secondary" : "destructive"}
                    size="lg"
                    className="rounded-full w-14 h-14"
                    onClick={() => {
                      localStream?.getVideoTracks().forEach(t => t.enabled = !isVideoEnabled);
                      setIsVideoEnabled(!isVideoEnabled);
                    }}
                    data-testid="preview-video-toggle"
                  >
                    {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                  </Button>
                </div>
              </div>

              {/* Join Section */}
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-white mb-1">Ready to join?</h2>
                  <p className="text-slate-400 text-sm">Meeting ID: {meetingId}</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate('/meetings')}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    onClick={joinMeeting}
                    data-testid="join-meeting-btn"
                  >
                    Join Meeting
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  // In-call screen
  return (
    <>
      <Helmet>
        <title>Meeting | Munal</title>
      </Helmet>

      <div className="min-h-screen bg-slate-950 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-green-400 border-green-400/50">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
              Live
            </Badge>
            <span className="text-slate-400 text-sm flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDuration(callDuration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyLink}
              className="text-slate-400 hover:text-white"
            >
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowParticipants(!showParticipants)}
              className={cn("text-slate-400 hover:text-white", showParticipants && "bg-slate-800")}
            >
              <Users className="w-4 h-4 mr-1" />
              {participants.length}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className={cn("text-slate-400 hover:text-white", showChat && "bg-slate-800")}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Video Grid */}
          <div className="flex-1 p-4">
            <div className={cn(
              "h-full grid gap-4 auto-rows-fr",
              allParticipants.length === 1 && "grid-cols-1",
              allParticipants.length === 2 && "grid-cols-1 md:grid-cols-2",
              allParticipants.length >= 3 && allParticipants.length <= 4 && "grid-cols-2",
              allParticipants.length >= 5 && "grid-cols-2 lg:grid-cols-3"
            )}>
              <AnimatePresence>
                {allParticipants.map((p) => (
                  <motion.div
                    key={p.user_id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <VideoTile
                      stream={p.stream}
                      name={p.user_name}
                      isLocal={p.isLocal}
                      isMuted={p.isLocal ? !isAudioEnabled : p.audio_enabled === false}
                      isVideoOff={p.isLocal ? !isVideoEnabled : p.video_enabled === false}
                      isLarge={allParticipants.length <= 2}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Chat Panel */}
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-slate-800 bg-slate-900/50 flex flex-col"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold text-white">Chat</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                {chatMessages.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center">No messages yet</p>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map(msg => (
                      <div key={msg.id} className="bg-slate-800/50 rounded-lg p-3">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>{msg.sender}</span>
                          <span>{msg.time}</span>
                        </div>
                        <p className="text-white text-sm">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 border-t border-slate-800">
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChat()}
                    placeholder="Type a message..."
                    className="bg-slate-800 border-slate-700"
                  />
                  <Button onClick={sendChat} size="sm">Send</Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Participants Panel */}
          {showParticipants && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-slate-800 bg-slate-900/50"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold text-white">Participants ({participants.length})</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowParticipants(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <ScrollArea className="p-4">
                <div className="space-y-2">
                  {participants.map(p => (
                    <div key={p.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-indigo-600 text-white text-xs">
                          {p.user_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white text-sm flex-1 truncate">
                        {p.user_name} {p.user_id === user?.id && '(You)'}
                      </span>
                      {!p.audio_enabled && <MicOff className="w-4 h-4 text-red-400" />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </div>

        {/* Control Bar */}
        <div className="border-t border-slate-800 bg-slate-900/80 backdrop-blur-xl p-4">
          <div className="flex items-center justify-center gap-3">
            <Button
              variant={isAudioEnabled ? "secondary" : "destructive"}
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={toggleAudio}
              data-testid="mic-toggle"
            >
              {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>

            <Button
              variant={isVideoEnabled ? "secondary" : "destructive"}
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={toggleVideo}
              data-testid="video-toggle"
            >
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>

            <Button
              variant={isScreenSharing ? "default" : "secondary"}
              size="lg"
              className={cn("rounded-full w-14 h-14", isScreenSharing && "bg-indigo-600")}
              onClick={toggleScreenShare}
              data-testid="screen-share-toggle"
            >
              <Monitor className="w-6 h-6" />
            </Button>

            <Button
              variant="destructive"
              size="lg"
              className="rounded-full w-14 h-14 ml-4"
              onClick={leaveMeeting}
              data-testid="leave-meeting-btn"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default InstantMeetingRoom;
