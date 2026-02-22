import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { messagingService } from '@/services/messagingService';
import { useToast } from '@/components/ui/use-toast';
import { AnimatePresence } from 'framer-motion';
import { useCallState } from '@/context/CallStateContext';
import { Button } from '@/components/ui/button';
import { Phone, Video, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Import Components
import '@/styles/workspaceChatStyles.css';
import UserInfoHeader from '@/components/chat/UserInfoHeader';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageInputArea from '@/components/chat/MessageInputArea';
import AudioCallModal from '@/components/call/AudioCallModal';
import VideoCallModal from '@/components/call/VideoCallModal';
import CallNotification from '@/components/call/CallNotification';
import CallHistoryPanel from '@/components/call/CallHistoryPanel';

const WorkspaceMemberChat = ({ conversation, currentUser }) => {
  const { toast } = useToast();
  const { 
    currentCall, 
    incomingCall, 
    startAudioCall, 
    startVideoCall, 
    acceptIncomingCall, 
    rejectIncomingCall,
    endCurrentCall,
    isCallHistoryOpen,
    setIsCallHistoryOpen
  } = useCallState();

  const [messages, setMessages] = useState([]);
  
  // Load Messages Loop
  useEffect(() => {
    if (conversation?.id) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000); // Poll for updates
      return () => clearInterval(interval);
    }
  }, [conversation?.id]);

  const loadMessages = async () => {
    try {
      const history = await messagingService.getConversationHistory(conversation.id);
      setMessages(history);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendMessage = async (text, attachments = []) => {
    try {
      await messagingService.sendMessage(
        conversation.id, 
        currentUser.id, 
        text, 
        currentUser.name, 
        attachments
      );
      loadMessages(); 
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send message' });
    }
  };

  // --- Call Handlers ---
  
  const handleStartAudioCall = () => {
    // Identify the other participant
    // For demo, we assume the conversation title/name IS the other user or we find them
    const recipient = { 
      id: conversation.id, // simplified for demo
      name: conversation.name,
      avatar: conversation.avatar,
      initials: conversation.initials
    };
    startAudioCall(currentUser, recipient);
  };

  const handleStartVideoCall = () => {
    const recipient = { 
      id: conversation.id,
      name: conversation.name,
      avatar: conversation.avatar,
      initials: conversation.initials
    };
    startVideoCall(currentUser, recipient);
  };

  // --- Render ---

  if (!conversation) return null;

  return (
    <div className="flex h-full w-full relative overflow-hidden bg-white/50 dark:bg-slate-950/50 backdrop-blur-md border-l border-violet-100 dark:border-violet-900/20">
      
      {/* Call Modals & Notifications */}
      <CallNotification 
        incomingCall={incomingCall} 
        onAccept={acceptIncomingCall} 
        onReject={rejectIncomingCall} 
      />
      
      <AudioCallModal 
        isOpen={currentCall?.type === 'audio'} 
        callData={currentCall} 
        onEndCall={endCurrentCall} 
      />
      
      <VideoCallModal 
        isOpen={currentCall?.type === 'video'} 
        callData={currentCall} 
        onEndCall={endCurrentCall} 
      />

      <div className="flex h-full">
         <div className="flex-1 flex flex-col min-w-0">
            {/* Header with Call Buttons */}
            <div className="flex items-center justify-between border-b border-violet-100 dark:border-violet-900/20 pr-4">
              <div className="flex-1">
                <UserInfoHeader conversation={conversation} isOnline={true} />
              </div>
              
              <div className="flex items-center gap-1">
                <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Button variant="ghost" size="icon" onClick={handleStartAudioCall} className="text-slate-500 hover:text-violet-600">
                         <Phone className="w-5 h-5" />
                       </Button>
                     </TooltipTrigger>
                     <TooltipContent>Audio Call</TooltipContent>
                   </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Button variant="ghost" size="icon" onClick={handleStartVideoCall} className="text-slate-500 hover:text-violet-600">
                         <Video className="w-5 h-5" />
                       </Button>
                     </TooltipTrigger>
                     <TooltipContent>Video Call</TooltipContent>
                   </Tooltip>
                </TooltipProvider>

                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />
                
                <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setIsCallHistoryOpen(!isCallHistoryOpen)}
                          className={isCallHistoryOpen ? "bg-violet-100 text-violet-700" : "text-slate-500 hover:text-violet-600"}
                        >
                         <Clock className="w-5 h-5" />
                       </Button>
                     </TooltipTrigger>
                     <TooltipContent>Call History</TooltipContent>
                   </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <MessageBubble 
                    key={msg.id}
                    message={msg}
                    isOwn={msg.sender_id === currentUser.id}
                    showAvatar={true}
                  />
                ))
              )}
            </div>

            {/* Input Area */}
            <MessageInputArea onSendMessage={handleSendMessage} />
         </div>

         {/* Call History Side Panel */}
         <AnimatePresence>
            {isCallHistoryOpen && (
               <CallHistoryPanel onClose={() => setIsCallHistoryOpen(false)} />
            )}
         </AnimatePresence>
      </div>
    </div>
  );
};

export default WorkspaceMemberChat;