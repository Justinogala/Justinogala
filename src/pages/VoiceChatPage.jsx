
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { History, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageTransition from '@/components/PageTransition';
import VoiceChatInterface from '@/components/VoiceChatInterface';
import VoiceControlPanel from '@/components/VoiceControlPanel';
import VoiceChatHistoryPage from '@/pages/VoiceChatHistoryPage';
import useVoiceSpeechRecognition from '@/hooks/useVoiceSpeechRecognition';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { voiceChatHistoryService } from '@/services/VoiceChatHistoryService';
import { downloadTranscription } from '@/services/voiceTranscriptionService';
import '@/styles/voiceChat.css';

const VoiceChatPage = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const { 
    isRecording, 
    transcript, 
    interimTranscript, 
    confidence, 
    error: recognitionError, 
    startListening, 
    stopListening, 
    clearTranscript 
  } = useVoiceSpeechRecognition();

  const [recordingTime, setRecordingTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Handle Recording Timer
  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Handle Recognition Errors
  useEffect(() => {
    if (recognitionError) {
      toast({
        variant: "destructive",
        title: "Recognition Error",
        description: recognitionError,
      });
    }
  }, [recognitionError, toast]);

  const handleStart = () => {
    setRecordingTime(0);
    startListening();
    toast({
      title: "Listening...",
      description: "Speak clearly into your microphone.",
    });
  };

  const handleStop = () => {
    stopListening();
    toast({
      title: "Recording Stopped",
      description: "Processing final transcript.",
    });
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear the current transcription?")) {
      clearTranscript();
      setRecordingTime(0);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
      });
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const handleDownload = () => {
    const success = downloadTranscription(transcript, 'voice-chat');
    if (success) {
      toast({
        title: "Downloaded",
        description: "Transcription saved to your device.",
      });
    }
  };

  const handleSave = async () => {
    if (!transcript.trim()) return;
    
    setIsSaving(true);
    
    // Save to local history service instead of API for now
    const saved = voiceChatHistoryService.addConversation({
      userId: user?.id,
      userName: user?.name || 'Guest User',
      userEmail: user?.email,
      userAvatar: user?.avatar,
      transcript: transcript,
      duration: recordingTime,
      confidence: confidence
    });

    setIsSaving(false);

    if (saved) {
      toast({
        title: "Saved to History",
        description: "Your voice session has been saved.",
      });
      // Optional: switch to history tab or clear current
      // setActiveTab('history'); 
    } else {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save transcription.",
      });
    }
  };

  const hasContent = transcript.length > 0;

  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-secondary/50 pb-12 flex flex-col voice-chat-container">
        <Helmet>
          <title>Voice Chat - Munal</title>
          <meta name="description" content="Real-time voice transcription and recording." />
        </Helmet>

        <div className="container mx-auto px-4 py-8 max-w-5xl flex-1 flex flex-col">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                Voice Assistant
              </h1>
              <p className="text-text-secondary">
                Convert speech to text in real-time or view your history.
              </p>
            </div>
            
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex items-center">
              <Button
                variant={activeTab === 'chat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('chat')}
                className="gap-2"
              >
                <Mic className="w-4 h-4" />
                Record
              </Button>
              <Button
                variant={activeTab === 'history' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('history')}
                className="gap-2"
              >
                <History className="w-4 h-4" />
                History
              </Button>
            </div>
          </div>

          <div className="flex-1">
            {activeTab === 'chat' ? (
              <div className="flex flex-col h-full justify-center">
                <VoiceChatInterface 
                  isRecording={isRecording}
                  transcript={transcript}
                  interimTranscript={interimTranscript}
                  recordingTime={recordingTime}
                  confidence={confidence}
                />
                
                <VoiceControlPanel 
                  isRecording={isRecording}
                  onStart={handleStart}
                  onStop={handleStop}
                  onClear={handleClear}
                  onSave={handleSave}
                  onDownload={handleDownload}
                  onCopy={handleCopyToClipboard}
                  hasContent={hasContent}
                  isSaving={isSaving}
                />
              </div>
            ) : (
              <VoiceChatHistoryPage 
                onStartNew={() => setActiveTab('chat')}
                onViewDetail={(item) => {
                  // Currently we don't have a detail page, so we could 
                  // potentially load it back into the editor or show a modal.
                  // For now, let's just toast.
                  toast({
                    title: "Detail View",
                    description: "Feature to view full transcript details coming soon.",
                  });
                }}
              />
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default VoiceChatPage;
