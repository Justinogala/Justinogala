
import { useState, useEffect, useCallback } from 'react';
import { adminMessageService } from '@/services/adminMessageService';
import { useToast } from '@/components/ui/use-toast';

export const useAdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all' // all, read, unread, archived, flagged
  });

  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminMessageService.getMessages({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        status: filters.status
      });
      setMessages(data.messages);
      setPagination(prev => ({
        ...prev,
        total: data.total,
        totalPages: data.totalPages
      }));
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch messages');
      toast({
        title: "Error",
        description: "Could not load messages. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters.search, filters.status, toast]);

  // Initial load
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const setPage = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleAction = async (actionFn, successMessage, errorMessage) => {
    try {
      await actionFn();
      if (successMessage) {
        toast({ title: "Success", description: successMessage, variant: "success" });
      }
      fetchMessages(); // Refresh list
      return true;
    } catch (error) {
      toast({ 
        title: "Error", 
        description: errorMessage || error.message || "Action failed", 
        variant: "destructive" 
      });
      return false;
    }
  };

  const markAsRead = (id) => handleAction(
    () => adminMessageService.markAsRead(id),
    null, // No toast for simple read status to avoid spamming
    "Failed to mark as read"
  );

  const markAsUnread = (id) => handleAction(
    () => adminMessageService.markAsUnread(id),
    "Marked as unread",
    "Failed to mark as unread"
  );

  const archiveMessage = (id) => handleAction(
    () => adminMessageService.archiveMessage(id),
    "Message archived",
    "Failed to archive message"
  );

  const deleteMessage = (id) => handleAction(
    () => adminMessageService.deleteMessage(id),
    "Message deleted permanently",
    "Failed to delete message"
  );

  const toggleFlag = (id) => handleAction(
    () => adminMessageService.toggleFlag(id),
    null,
    "Failed to update flag"
  );

  const replyToMessage = (id, content) => handleAction(
    () => adminMessageService.replyToMessage(id, content),
    "Reply sent successfully",
    "Failed to send reply"
  );

  const exportCSV = async (startDate, endDate, status) => {
    try {
      await adminMessageService.exportCSV(startDate, endDate, status);
      toast({ title: "Success", description: "Messages exported to CSV" });
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Failed to export messages", variant: "destructive" });
      return false;
    }
  };

  const exportJSON = async (startDate, endDate, status) => {
    try {
      await adminMessageService.exportJSON(startDate, endDate, status);
      toast({ title: "Success", description: "Messages exported to JSON" });
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Failed to export messages", variant: "destructive" });
      return false;
    }
  };

  return {
    messages,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    setPage,
    refresh: fetchMessages,
    actions: {
      markAsRead,
      markAsUnread,
      archiveMessage,
      deleteMessage,
      toggleFlag,
      replyToMessage,
      exportCSV,
      exportJSON
    }
  };
};
