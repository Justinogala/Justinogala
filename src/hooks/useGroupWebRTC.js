import { useState, useRef, useCallback, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

// ICE server configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export const useGroupWebRTC = ({
  roomId,
  userId,
  userName,
  localStream,
  onParticipantJoined,
  onParticipantLeft,
  onParticipantUpdated,
  onRemoteStream
}) => {
  const [participants, setParticipants] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  
  // Store peer connections for each remote participant
  const peerConnections = useRef(new Map()); // userId -> RTCPeerConnection
  const remoteStreams = useRef(new Map()); // userId -> MediaStream
  const eventSourceRef = useRef(null);
  const pendingCandidates = useRef(new Map()); // userId -> ICE candidates waiting for remote description
  
  // Create peer connection for a specific participant
  const createPeerConnection = useCallback((participantId, participantName, isInitiator = false) => {
    if (peerConnections.current.has(participantId)) {
      console.log(`Peer connection already exists for ${participantId}`);
      return peerConnections.current.get(participantId);
    }
    
    console.log(`Creating peer connection for ${participantId}, isInitiator: ${isInitiator}`);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current.set(participantId, pc);
    pendingCandidates.current.set(participantId, []);
    
    // Add local tracks to the connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }
    
    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          await fetch(`${API_URL}/api/group-call/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              room_id: roomId,
              sender_id: userId,
              sender_name: userName,
              target_id: participantId,
              signal_type: 'ice_candidate',
              signal_data: { candidate: event.candidate }
            })
          });
        } catch (err) {
          console.error('Error sending ICE candidate:', err);
        }
      }
    };
    
    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state for ${participantId}: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        // Attempt to restart ICE
        console.log(`Attempting to restart ICE for ${participantId}`);
      }
    };
    
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE state for ${participantId}: ${pc.iceConnectionState}`);
    };
    
    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      console.log(`Received remote track from ${participantId}`, event.streams);
      if (event.streams && event.streams[0]) {
        remoteStreams.current.set(participantId, event.streams[0]);
        if (onRemoteStream) {
          onRemoteStream(participantId, participantName, event.streams[0]);
        }
      }
    };
    
    return pc;
  }, [roomId, userId, userName, localStream, onRemoteStream]);
  
  // Process pending ICE candidates
  const processPendingCandidates = useCallback(async (participantId) => {
    const pc = peerConnections.current.get(participantId);
    const candidates = pendingCandidates.current.get(participantId) || [];
    
    if (pc && pc.remoteDescription && candidates.length > 0) {
      console.log(`Processing ${candidates.length} pending candidates for ${participantId}`);
      for (const candidate of candidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding pending ICE candidate:', err);
        }
      }
      pendingCandidates.current.set(participantId, []);
    }
  }, []);
  
  // Create and send offer to a participant
  const createOffer = useCallback(async (participantId, participantName) => {
    const pc = createPeerConnection(participantId, participantName, true);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      await fetch(`${API_URL}/api/group-call/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          sender_id: userId,
          sender_name: userName,
          target_id: participantId,
          signal_type: 'offer',
          signal_data: { offer: pc.localDescription }
        })
      });
      
      console.log(`Offer sent to ${participantId}`);
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  }, [createPeerConnection, roomId, userId, userName]);
  
  // Handle received offer
  const handleOffer = useCallback(async (senderId, senderName, offer) => {
    console.log(`Received offer from ${senderId}`);
    const pc = createPeerConnection(senderId, senderName, false);
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await processPendingCandidates(senderId);
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      await fetch(`${API_URL}/api/group-call/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          sender_id: userId,
          sender_name: userName,
          target_id: senderId,
          signal_type: 'answer',
          signal_data: { answer: pc.localDescription }
        })
      });
      
      console.log(`Answer sent to ${senderId}`);
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  }, [createPeerConnection, processPendingCandidates, roomId, userId, userName]);
  
  // Handle received answer
  const handleAnswer = useCallback(async (senderId, answer) => {
    console.log(`Received answer from ${senderId}`);
    const pc = peerConnections.current.get(senderId);
    
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await processPendingCandidates(senderId);
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    }
  }, [processPendingCandidates]);
  
  // Handle received ICE candidate
  const handleIceCandidate = useCallback(async (senderId, candidate) => {
    const pc = peerConnections.current.get(senderId);
    
    if (pc) {
      if (pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      } else {
        // Queue the candidate for later
        const pending = pendingCandidates.current.get(senderId) || [];
        pending.push(candidate);
        pendingCandidates.current.set(senderId, pending);
        console.log(`Queued ICE candidate for ${senderId}`);
      }
    }
  }, []);
  
  // Join the room
  const joinRoom = useCallback(async (videoEnabled = true, audioEnabled = true) => {
    try {
      const response = await fetch(`${API_URL}/api/group-call/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          user_id: userId,
          user_name: userName,
          video_enabled: videoEnabled,
          audio_enabled: audioEnabled
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setParticipants(data.room.participants);
        setIsConnected(true);
        
        // Create offers to all existing participants (except ourselves)
        const existingParticipants = data.room.participants.filter(p => p.user_id !== userId);
        for (const participant of existingParticipants) {
          // Small delay between offers to prevent overwhelming
          await new Promise(resolve => setTimeout(resolve, 100));
          await createOffer(participant.user_id, participant.user_name);
        }
        
        console.log(`Joined room ${roomId} with ${existingParticipants.length} existing participants`);
      }
      
      return data;
    } catch (err) {
      console.error('Error joining room:', err);
      return { success: false, error: err.message };
    }
  }, [roomId, userId, userName, createOffer]);
  
  // Leave the room
  const leaveRoom = useCallback(async () => {
    try {
      // Close all peer connections
      peerConnections.current.forEach((pc, participantId) => {
        pc.close();
      });
      peerConnections.current.clear();
      remoteStreams.current.clear();
      pendingCandidates.current.clear();
      
      // Close SSE connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      // Notify server
      await fetch(`${API_URL}/api/group-call/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          user_id: userId
        })
      });
      
      setIsConnected(false);
      setParticipants([]);
      
      console.log(`Left room ${roomId}`);
    } catch (err) {
      console.error('Error leaving room:', err);
    }
  }, [roomId, userId]);
  
  // Update participant status
  const updateParticipantStatus = useCallback(async (updates) => {
    try {
      await fetch(`${API_URL}/api/group-call/update-participant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          user_id: userId,
          ...updates
        })
      });
    } catch (err) {
      console.error('Error updating participant status:', err);
    }
  }, [roomId, userId]);
  
  // Setup SSE listener for signaling
  useEffect(() => {
    if (!isConnected || !userId) return;
    
    const setupSSE = () => {
      const eventSource = new EventSource(`${API_URL}/api/sse/events/${userId}`);
      eventSourceRef.current = eventSource;
      
      eventSource.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'group_call_signal':
              if (data.room_id === roomId) {
                const { sender_id, sender_name, signal_type, signal_data } = data;
                
                if (signal_type === 'offer') {
                  await handleOffer(sender_id, sender_name, signal_data.offer);
                } else if (signal_type === 'answer') {
                  await handleAnswer(sender_id, signal_data.answer);
                } else if (signal_type === 'ice_candidate') {
                  await handleIceCandidate(sender_id, signal_data.candidate);
                }
              }
              break;
              
            case 'group_call_participant_joined':
              if (data.room_id === roomId) {
                const newParticipant = data.participant;
                setParticipants(prev => {
                  if (prev.find(p => p.user_id === newParticipant.user_id)) return prev;
                  return [...prev, newParticipant];
                });
                if (onParticipantJoined) {
                  onParticipantJoined(newParticipant);
                }
              }
              break;
              
            case 'group_call_participant_left':
              if (data.room_id === roomId) {
                const leftUserId = data.user_id;
                
                // Close and remove peer connection
                const pc = peerConnections.current.get(leftUserId);
                if (pc) {
                  pc.close();
                  peerConnections.current.delete(leftUserId);
                }
                remoteStreams.current.delete(leftUserId);
                pendingCandidates.current.delete(leftUserId);
                
                setParticipants(prev => prev.filter(p => p.user_id !== leftUserId));
                if (onParticipantLeft) {
                  onParticipantLeft(leftUserId);
                }
              }
              break;
              
            case 'group_call_participant_updated':
              if (data.room_id === roomId) {
                setParticipants(prev => prev.map(p => 
                  p.user_id === data.user_id ? { ...p, ...data.updates } : p
                ));
                if (data.updates.is_speaking) {
                  setActiveSpeaker(data.user_id);
                }
                if (onParticipantUpdated) {
                  onParticipantUpdated(data.user_id, data.updates);
                }
              }
              break;
          }
        } catch (err) {
          console.error('Error processing SSE message:', err);
        }
      };
      
      eventSource.onerror = () => {
        console.log('SSE connection error, will retry...');
        eventSource.close();
        // Retry after a delay
        setTimeout(setupSSE, 3000);
      };
    };
    
    setupSSE();
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [isConnected, userId, roomId, handleOffer, handleAnswer, handleIceCandidate, onParticipantJoined, onParticipantLeft, onParticipantUpdated]);
  
  // Cleanup on unmount
  useEffect(() => {
    const currentPeerConnections = peerConnections.current;
    const currentEventSource = eventSourceRef.current;
    
    return () => {
      currentPeerConnections.forEach(pc => pc.close());
      currentPeerConnections.clear();
      if (currentEventSource) {
        currentEventSource.close();
      }
    };
  }, []);
  
  // Get remote streams as a function to avoid ref access during render
  const getRemoteStreams = useCallback(() => remoteStreams.current, []);
  const getPeerConnections = useCallback(() => peerConnections.current, []);
  
  return {
    participants,
    isConnected,
    activeSpeaker,
    getRemoteStreams,
    getPeerConnections,
    joinRoom,
    leaveRoom,
    updateParticipantStatus
  };
};

export default useGroupWebRTC;
