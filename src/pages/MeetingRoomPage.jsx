import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, Users, 
  MessageSquare, Settings, Maximize2, Minimize2, 
  Share, Copy, Check, Clock, Calendar
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
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [copied, setCopied] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState(null);
  
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  // Load meeting details
  useEffect(() => {
    const loadMeeting = async () => {
      try {
        const response = await fetch(`${API_URL}/api/calendar/events/${meetingId}`);
        if (response.ok) {
          const data = await response.json();
          setMeeting(data);
        } else {
          toast({ variant: 'destructive', title: 'Meeting not found' });
        }
      } catch (err) {
        console.error('Error loading meeting:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (meetingId) loadMeeting();
  }, [meetingId, toast]);

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
      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setJoined(true);
      setCallStartTime(Date.now());
      
      // Add self to participants
      setParticipants([{
        id: user?.id,
        name: user?.name || 'You',
        isLocal: true,
        videoEnabled: true,
        audioEnabled: true
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
    setJoined(false);
    navigate('/calendar');
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
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
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

  if (!meeting) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Meeting Not Found</h1>
          <p className="text-gray-400 mb-4">This meeting may have been cancelled or the link is invalid.</p>
          <Button onClick={() => navigate('/calendar')}>Back to Calendar</Button>
        </div>
      </div>
    );
  }

  // Pre-join screen
  if (!joined) {
    return (
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
              <h1 className="text-2xl font-bold text-white mb-2">{meeting.title}</h1>
              <div className="flex items-center gap-4 text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{format(parseISO(meeting.start_time), 'EEEE, MMMM d')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{format(parseISO(meeting.start_time), 'h:mm a')}</span>
                </div>
              </div>
              {meeting.description && (
                <p className="text-gray-500 mt-2">{meeting.description}</p>
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
                  className="w-full h-full object-cover"
                />
                {!localStreamRef.current && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Avatar className="h-24 w-24 mx-auto mb-4">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-3xl">
                          {user?.name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-gray-400">Camera preview will appear here</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls Preview */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <Button
                  variant={isAudioEnabled ? "secondary" : "destructive"}
                  size="lg"
                  className="rounded-full h-14 w-14"
                  onClick={toggleAudio}
                >
                  {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </Button>
                <Button
                  variant={isVideoEnabled ? "secondary" : "destructive"}
                  size="lg"
                  className="rounded-full h-14 w-14"
                  onClick={toggleVideo}
                >
                  {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </Button>
              </div>

              {/* Join Button */}
              <div className="flex gap-3">
                <Button
                  onClick={joinMeeting}
                  className="flex-1 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-lg font-semibold"
                >
                  <Video className="w-5 h-5 mr-2" />
                  Join Meeting
                </Button>
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={copyMeetingLink}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>

              {/* Attendees */}
              {meeting.invitees?.length > 0 && (
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
    );
  }

  // In-meeting view
  return (
    <div className="h-screen bg-slate-950 flex flex-col">
      <Helmet><title>{meeting.title} | Meeting</title></Helmet>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900/80 border-b border-white/10">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">{meeting.title}</h1>
          <Badge variant="secondary" className="bg-red-500/20 text-red-400">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
            {formatDuration(callDuration)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={copyMeetingLink} className="text-gray-400">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400">
            <Users className="w-4 h-4 mr-2" />
            {participants.length}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Grid */}
        <div className={cn("flex-1 p-4", showChat && "mr-80")}>
          <div className="h-full grid grid-cols-1 gap-4">
            {/* Local Video */}
            <div className="relative bg-slate-800 rounded-2xl overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={cn("w-full h-full object-cover", !isVideoEnabled && "hidden")}
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                  <Avatar className="h-32 w-32">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-4xl">
                      {user?.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                  {user?.name || 'You'}
                </span>
                {!isAudioEnabled && (
                  <span className="bg-red-500/80 text-white p-1 rounded-full">
                    <MicOff className="w-4 h-4" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="absolute right-0 top-14 bottom-20 w-80 bg-slate-900 border-l border-white/10 flex flex-col">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-semibold text-white">Meeting Chat</h3>
            </div>
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
                <Button onClick={sendChatMessage}>Send</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-4 bg-slate-900/80 border-t border-white/10">
        <Button
          variant={isAudioEnabled ? "secondary" : "destructive"}
          size="lg"
          className="rounded-full h-14 w-14"
          onClick={toggleAudio}
        >
          {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </Button>
        
        <Button
          variant={isVideoEnabled ? "secondary" : "destructive"}
          size="lg"
          className="rounded-full h-14 w-14"
          onClick={toggleVideo}
        >
          {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          className="rounded-full h-14 w-14 bg-red-500 hover:bg-red-600"
          onClick={leaveMeeting}
        >
          <PhoneOff className="w-6 h-6" />
        </Button>

        <Button
          variant={showChat ? "default" : "secondary"}
          size="lg"
          className="rounded-full h-14 w-14"
          onClick={() => setShowChat(!showChat)}
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default MeetingRoomPage;
