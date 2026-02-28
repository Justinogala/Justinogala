import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, Users, 
  MessageSquare, Monitor, MonitorOff, Copy, Check, Clock, Calendar,
  Hand, MoreHorizontal, Settings, Maximize2, Grid
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

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

const MeetingRoomPage = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [copied, setCopied] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState(null);
  const [handRaised, setHandRaised] = useState(false);
  const [previewStarted, setPreviewStarted] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Load meeting details
  useEffect(() => {
    const loadMeeting = async () => {
      try {
        const response = await fetch(`${API_URL}/api/calendar/events/${meetingId}`);
        if (response.ok) {
          const data = await response.json();
          setMeeting(data);
        } else {
          // Meeting not found in database - create instant meeting
          const instantMeeting = {
            id: meetingId,
            title: 'Instant Meeting',
            description: 'Quick meeting started from dashboard',
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            video_call: true,
            isInstant: true,
            invitees: []
          };
          setMeeting(instantMeeting);
        }
      } catch (err) {
        console.error('Error loading meeting:', err);
        // On error, still allow instant meeting
        const instantMeeting = {
          id: meetingId,
          title: 'Instant Meeting',
          description: 'Quick meeting started from dashboard',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          video_call: true,
          isInstant: true,
          invitees: []
        };
        setMeeting(instantMeeting);
      } finally {
        setLoading(false);
      }
    };
    
    if (meetingId) loadMeeting();
  }, [meetingId]);

  // Auto-start camera preview
  useEffect(() => {
    let isMounted = true;
    
    const startPreview = async () => {
      if (previewStarted || joined || loading) return;
      
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
        
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        localStreamRef.current = stream;
        
        // Ensure video element is ready
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.onloadedmetadata = () => {
            if (isMounted) {
              localVideoRef.current?.play()
                .then(() => {
                  setVideoPlaying(true);
                  console.log('Video playing successfully');
                })
                .catch(e => console.log('Video play error:', e));
            }
          };
        }
        
        setPreviewStarted(true);
        console.log('Camera preview started successfully');
      } catch (err) {
        console.error('Error starting preview:', err);
        // Set error message based on error type
        if (isMounted) {
          if (err.name === 'NotAllowedError') {
            setCameraError('Camera access denied. Please allow camera access in your browser settings.');
          } else if (err.name === 'NotFoundError') {
            setCameraError('No camera found. Please connect a camera and try again.');
          } else if (err.name === 'NotReadableError') {
            setCameraError('Camera is in use by another application.');
          } else {
            setCameraError('Could not access camera. Please check your settings.');
          }
          setPreviewStarted(true);
        }
      }
    };
    
    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      if (!loading) {
        startPreview();
      }
    }, 500);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (!joined && localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [loading, previewStarted, joined]);

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
      if (!localStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
      
      setJoined(true);
      setCallStartTime(Date.now());
      
      setParticipants([{
        id: user?.id,
        name: user?.name || 'You',
        isLocal: true,
        videoEnabled: isVideoEnabled,
        audioEnabled: isAudioEnabled
      }]);
      
      toast({ title: 'Joined meeting', description: meeting?.title });
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
  const leaveMeeting = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setJoined(false);
    navigate('/meetings');
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const newState = !isVideoEnabled;
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = newState;
      });
      setIsVideoEnabled(newState);
      // Update videoPlaying state based on new video state
      if (!newState) {
        setVideoPlaying(false);
      }
    }
  };

  // Toggle screen share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        screenStreamRef.current = screenStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        screenStream.getVideoTracks()[0].onended = () => {
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
          setIsScreenSharing(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Pre-join screen
  if (!joined) {
    const meetingTitle = meeting?.title || 'Instant Meeting';
    const meetingDescription = meeting?.description || 'Start your video call';
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
                {isInstantMeeting && (
                  <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                    Instant
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-gray-400">
                {meeting?.start_time && (
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
                    <span>Ready to start</span>
                  </div>
                )}
              </div>
              {meetingDescription && (
                <p className="text-gray-500 mt-2">{meetingDescription}</p>
              )}
              {isInstantMeeting && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
                  <span className="px-2 py-1 bg-slate-800 rounded text-xs font-mono">{meetingId}</span>
                  <span className="text-gray-500">Meeting ID</span>
                </div>
              )}
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
                    "w-full h-full object-cover transition-opacity duration-300",
                    (!isVideoEnabled || !videoPlaying) ? "opacity-0" : "opacity-100"
                  )}
                  onPlaying={() => setVideoPlaying(true)}
                />
                {/* Show avatar when video is off */}
                {!isVideoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                    <Avatar className="h-24 w-24">
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-3xl">
                        {user?.name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
                {/* Show loading state when video is enabled but not yet playing */}
                {isVideoEnabled && !videoPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                    <div className="text-center">
                      <Avatar className="h-24 w-24 mx-auto mb-4">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-3xl">
                          {user?.name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-gray-400 flex items-center gap-2 justify-center">
                        <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
                        Starting camera...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls Preview with Labels */}
              <TooltipProvider>
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
                          onClick={toggleAudio}
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
                          onClick={toggleVideo}
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
              </TooltipProvider>

              {/* Join Button */}
              <div className="flex gap-3">
                <Button
                  onClick={joinMeeting}
                  className="flex-1 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-lg font-semibold"
                  data-testid="join-meeting-btn"
                >
                  <Video className="w-5 h-5 mr-2" />
                  Join Meeting
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-12 border-slate-600"
                      onClick={copyMeetingLink}
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy meeting link</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Attendees */}
              {meeting?.invitees?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Invited ({meeting.invitees.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {meeting.invitees.map((inv, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-indigo-600">{inv.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-300">{inv.name || inv.email}</span>
                        <Badge variant={inv.status === 'accepted' ? 'default' : 'secondary'} className="text-xs">
                          {inv.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      </TooltipProvider>
    );
  }

  // In-meeting view
  const inMeetingTitle = meeting?.title || 'Instant Meeting';
  
  return (
    <div className="h-screen bg-slate-950 flex flex-col">
      <Helmet><title>{inMeetingTitle} | Meeting</title></Helmet>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900/80 border-b border-white/10">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">{inMeetingTitle}</h1>
          <Badge variant="secondary" className="bg-red-500/20 text-red-400">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
            {formatDuration(callDuration)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={copyMeetingLink} className="text-gray-400 hover:text-white">
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  Invite
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy meeting link to invite others</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button 
            variant={showParticipants ? "default" : "ghost"} 
            size="sm" 
            className="text-gray-400 hover:text-white"
            onClick={() => setShowParticipants(!showParticipants)}
          >
            <Users className="w-4 h-4 mr-2" />
            {participants.length}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className={cn("flex-1 p-4 transition-all", (showChat || showParticipants) && "pr-0")}>
          <div className="h-full grid grid-cols-1 gap-4">
            {/* Local Video */}
            <div className="relative bg-slate-800 rounded-2xl overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={cn("w-full h-full object-cover", (!isVideoEnabled && !isScreenSharing) && "hidden")}
              />
              {!isVideoEnabled && !isScreenSharing && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                  <Avatar className="h-32 w-32">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-4xl">
                      {user?.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="bg-black/50 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
                  {user?.name || 'You'} {isScreenSharing && '(Screen)'}
                </span>
                {!isAudioEnabled && (
                  <span className="bg-red-500/80 text-white p-1.5 rounded-full">
                    <MicOff className="w-4 h-4" />
                  </span>
                )}
                {handRaised && (
                  <span className="bg-yellow-500/80 text-white p-1.5 rounded-full">
                    <Hand className="w-4 h-4" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {(showChat || showParticipants) && (
          <div className="w-80 bg-slate-900 border-l border-white/10 flex flex-col">
            {/* Sidebar Tabs */}
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
                Participants ({participants.length})
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
                  {participants.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-indigo-600">{p.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{p.name} {p.isLocal && '(You)'}</p>
                      </div>
                      <div className="flex gap-1">
                        {!p.audioEnabled && <MicOff className="w-4 h-4 text-red-400" />}
                        {!p.videoEnabled && <VideoOff className="w-4 h-4 text-red-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </div>

      {/* Controls - Jizira Style */}
      <TooltipProvider>
        <div className="flex items-center justify-center gap-3 py-5 px-6 bg-slate-900 border-t border-white/10">
          {/* Left Controls */}
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    className={cn(
                      "rounded-xl h-14 w-14 shadow-lg transition-all",
                      isAudioEnabled 
                        ? "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600" 
                        : "bg-red-500 hover:bg-red-400 text-white"
                    )}
                    onClick={toggleAudio}
                    data-testid="toggle-mic-btn"
                  >
                    {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                  </Button>
                  <span className="text-xs text-gray-300 mt-1.5 font-medium">{isAudioEnabled ? 'Mute' : 'Unmute'}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isAudioEnabled ? 'Turn off microphone (m)' : 'Turn on microphone (m)'}</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    className={cn(
                      "rounded-xl h-14 w-14 shadow-lg transition-all",
                      isVideoEnabled 
                        ? "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600" 
                        : "bg-red-500 hover:bg-red-400 text-white"
                    )}
                    onClick={toggleVideo}
                    data-testid="toggle-video-btn"
                  >
                    {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                  </Button>
                  <span className="text-xs text-gray-300 mt-1.5 font-medium">{isVideoEnabled ? 'Stop Video' : 'Start Video'}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isVideoEnabled ? 'Turn off camera (v)' : 'Turn on camera (v)'}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
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
                  <span className="text-xs text-gray-300 mt-1.5 font-medium">{isScreenSharing ? 'Stop Share' : 'Share'}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isScreenSharing ? 'Stop screen sharing' : 'Share your screen'}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    className={cn(
                      "rounded-xl h-14 w-14 shadow-lg transition-all",
                      handRaised 
                        ? "bg-yellow-500 hover:bg-yellow-400 text-white" 
                        : "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                    )}
                    onClick={() => setHandRaised(!handRaised)}
                    data-testid="raise-hand-btn"
                  >
                    <Hand className="w-6 h-6" />
                  </Button>
                  <span className="text-xs text-gray-300 mt-1.5 font-medium">{handRaised ? 'Lower' : 'Raise'}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{handRaised ? 'Lower your hand' : 'Raise your hand'}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Center - End Call */}
          <div className="mx-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    className="rounded-xl h-14 px-8 bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30 font-semibold"
                    onClick={leaveMeeting}
                    data-testid="leave-meeting-btn"
                  >
                    <PhoneOff className="w-5 h-5 mr-2" />
                    Leave
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Leave meeting</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    className={cn(
                      "rounded-xl h-14 w-14 shadow-lg transition-all",
                      showParticipants 
                        ? "bg-indigo-500 hover:bg-indigo-400 text-white" 
                        : "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                    )}
                    onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
                    data-testid="participants-btn"
                  >
                    <Users className="w-6 h-6" />
                  </Button>
                  <span className="text-xs text-gray-300 mt-1.5 font-medium">People</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>View participants</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    className={cn(
                      "rounded-xl h-14 w-14 shadow-lg transition-all",
                      showChat 
                        ? "bg-indigo-500 hover:bg-indigo-400 text-white" 
                        : "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                    )}
                    onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
                    data-testid="chat-btn"
                  >
                    <MessageSquare className="w-6 h-6" />
                  </Button>
                  <span className="text-xs text-gray-300 mt-1.5 font-medium">Chat</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open meeting chat</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    className="rounded-xl h-14 w-14 shadow-lg bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 transition-all"
                    data-testid="more-options-btn"
                  >
                    <MoreHorizontal className="w-6 h-6" />
                  </Button>
                  <span className="text-xs text-gray-300 mt-1.5 font-medium">More</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>More options</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default MeetingRoomPage;
