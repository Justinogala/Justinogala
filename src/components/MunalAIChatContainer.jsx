import React, { useState, useContext, useEffect } from 'react';
import MunalAIChatWidget from './MunalAIChatWidget';
import { munalAIChatService } from '@/services/munalAIChatService';
import { useToast } from '@/components/ui/use-toast';
import { APIKeyManagementContext } from '@/context/APIKeyManagementContext';

const MunalAIChatContainer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  
  // Use the context to check for API key validity
  const { isValid: isApiKeyValid, isLoading: isKeyLoading } = useContext(APIKeyManagementContext);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { 
          role: 'assistant', 
          content: "Hello! I'm Munal AI. How can I help you with your transcriptions or meetings today?", 
          timestamp: new Date() 
        }
      ]);
    }
  }, []);

  const handleSendMessage = async (content) => {
    // Pre-flight check
    if (!isApiKeyValid) {
      toast({
        title: "Configuration Required",
        description: "Please configure your OpenAI API Key in settings to use Munal AI.",
        variant: "destructive"
      });
      
      setMessages(prev => [
        ...prev,
        { role: 'user', content, timestamp: new Date() },
        { 
          role: 'assistant', 
          content: "I cannot process your request because the OpenAI API Key is missing or invalid. Please check your settings.", 
          timestamp: new Date(), 
          isError: true 
        }
      ]);
      return;
    }

    // Add User Message
    const userMsg = { role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Prepare history for API (last 10 messages context)
      const apiMessages = [...messages, userMsg]
        .filter(m => !m.isError) // Filter out error messages
        .slice(-10)
        .map(({ role, content }) => ({ role, content }));

      await munalAIChatService.sendMessageStream(
        apiMessages,
        (chunk) => {
          // Chunk received - update streaming message
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg.role === 'assistant' && lastMsg.isStreaming) {
              return [
                ...prev.slice(0, -1),
                { ...lastMsg, content: lastMsg.content + chunk }
              ];
            } else {
              return [
                ...prev,
                { role: 'assistant', content: chunk, timestamp: new Date(), isStreaming: true }
              ];
            }
          });
        },
        (fullResponse) => {
          // Stream Complete
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            return [
              ...prev.slice(0, -1),
              { ...lastMsg, content: fullResponse, isStreaming: false }
            ];
          });
          setIsTyping(false);
        },
        (error) => {
          setIsTyping(false);
          toast({ 
            title: "Error", 
            description: error || "Failed to get response from Munal AI.",
            variant: "destructive" 
          });
          // Add error message to chat
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: `Error: ${error || "Connection failed."}`, timestamp: new Date(), isError: true }
          ]);
        }
      );

    } catch (error) {
      setIsTyping(false);
      console.error(error);
    }
  };

  const toggleOpen = () => {
    if (isMinimized) {
      setIsMinimized(false);
      setIsOpen(true);
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <MunalAIChatWidget 
      isOpen={isOpen}
      isMinimized={isMinimized}
      messages={messages}
      isTyping={isTyping}
      isConfigured={isApiKeyValid}
      isLoadingConfig={isKeyLoading}
      onToggleOpen={toggleOpen}
      onToggleMinimize={() => setIsMinimized(!isMinimized)}
      onClose={() => setIsOpen(false)}
      onSendMessage={handleSendMessage}
    />
  );
};

export default MunalAIChatContainer;