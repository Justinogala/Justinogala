import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { MessageSquare as MessageSquareText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import MessageSearchBar from '@/components/chat/MessageSearchBar';
import MessageFilterOptions from '@/components/chat/MessageFilterOptions';
import MessageList from '@/components/chat/MessageList';
import { demoMessagesService } from '@/services/demoMessagesService';

const ChatMessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    status: 'all',
    role: 'all',
    timeRange: 'all'
  });

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, []);

  // Apply filters whenever messages or filter states change
  useEffect(() => {
    if (messages.length > 0) {
      const results = demoMessagesService.filterMessages(messages, {
        query: searchQuery,
        ...activeFilters
      });
      setFilteredMessages(results);
    }
  }, [messages, searchQuery, activeFilters]);

  const loadMessages = async () => {
    setIsLoading(true);
    // Initialize data if needed
    demoMessagesService.init();
    
    try {
      const data = await demoMessagesService.getMessages();
      setMessages(data);
      setFilteredMessages(data);
    } catch (error) {
      toast({
        title: "Error loading messages",
        description: "Could not fetch chat history.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (type, value) => {
    if (type === 'clear') {
      setActiveFilters({
        status: 'all',
        role: 'all',
        timeRange: 'all'
      });
      setSearchQuery('');
    } else {
      setActiveFilters(prev => ({
        ...prev,
        [type]: value
      }));
    }
  };

  const handleMarkAsRead = async (id) => {
    const success = await demoMessagesService.markAsRead(id);
    if (success) {
      // Update local state optimistically
      setMessages(prev => prev.map(msg => 
        msg.id === id ? { ...msg, isRead: true } : msg
      ));
      toast({
        title: "Message marked as read",
        description: "Status updated successfully.",
        variant: "success",
      });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto min-h-screen pb-20 space-y-6">
      <Helmet>
        <title>Messages | Munal</title>
      </Helmet>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <MessageSquareText className="w-8 h-8 text-violet-600" />
            Messages
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            View and manage user communications and support requests.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadMessages}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 space-y-4">
        <MessageSearchBar onSearch={setSearchQuery} />
        <MessageFilterOptions 
          filters={activeFilters} 
          onFilterChange={handleFilterChange} 
        />
      </div>

      {/* Message List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <MessageList 
          messages={filteredMessages} 
          isLoading={isLoading} 
          onMarkRead={handleMarkAsRead} 
        />
      </motion.div>
    </div>
  );
};

export default ChatMessagesPage;