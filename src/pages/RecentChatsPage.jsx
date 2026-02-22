
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import RecentChatList from '@/components/chat/RecentChatList';
import PageTransition from '@/components/PageTransition';
import { recentChatsService } from '@/services/recentChatsService';
import { initializeDemoMessages } from '@/utils/initializeDemoMessages';

const RecentChatsPage = () => {
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Ensure demo data is ready
    initializeDemoMessages();
    loadChats();
  }, []);

  const loadChats = async () => {
    setIsLoading(true);
    try {
      // This service now pulls from the robust demoUsers.js file
      const data = await recentChatsService.getRecentChats();
      setChats(data);
    } catch (error) {
      console.error("Failed to load chats:", error);
      // We don't show a toast error here to avoid startling the user if it's just a transient issue,
      // relying instead on the empty state in the list if data is missing.
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatClick = (chatId) => {
    navigate(`/messages?chat=${chatId}`);
  };

  const handleDelete = async (chatId) => {
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      const success = await recentChatsService.deleteChat(chatId);
      if (success) {
        setChats(prev => prev.filter(c => c.id !== chatId));
        toast({
          title: "Success",
          description: "Conversation deleted.",
          variant: "success"
        });
      }
    }
  };

  const handleArchive = async (chatId) => {
    const success = await recentChatsService.archiveChat(chatId);
    if (success) {
      setChats(prev => prev.filter(c => c.id !== chatId));
      toast({
        title: "Archived",
        description: "Conversation moved to archive.",
      });
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 pb-20">
        <Helmet>
          <title>Recent Chats | Munal</title>
        </Helmet>

        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <MessageCircle className="w-8 h-8 text-violet-600" />
                Recent Chats
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Manage your active conversations and messages.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadChats} disabled={isLoading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 md:p-8"
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
                <p className="text-gray-500">Loading conversations...</p>
              </div>
            ) : (
              <RecentChatList 
                chats={chats}
                onChatClick={handleChatClick}
                onDelete={handleDelete}
                onArchive={handleArchive}
              />
            )}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default RecentChatsPage;
