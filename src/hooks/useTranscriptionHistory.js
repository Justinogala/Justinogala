
import { useState, useEffect, useCallback } from 'react';
import { transcriptionHistoryService } from '@/services/transcriptionHistoryService';
import { transcriptionService } from '@/services/transcriptionService';
import { useToast } from '@/components/ui/use-toast';

export const useTranscriptionHistory = () => {
  const [transcriptions, setTranscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchTranscriptions = useCallback(() => {
    try {
      const data = transcriptionHistoryService.getTranscriptions();
      setTranscriptions(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load transcription history.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initial load and event listeners for real-time sync
  useEffect(() => {
    fetchTranscriptions();

    const handleStorageUpdate = () => {
      fetchTranscriptions();
    };

    // Listen for custom event from same window
    window.addEventListener('transcription_storage_update', handleStorageUpdate);
    // Listen for storage event from other tabs
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('transcription_storage_update', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [fetchTranscriptions]);

  const saveTranscription = useCallback(async (data) => {
    try {
      const newItem = await transcriptionService.saveTranscription(data);
      // State update happens automatically via event listener
      return newItem;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateTranscription = useCallback(async (id, updates) => {
    try {
      const updatedItem = await transcriptionService.updateTranscription(id, updates);
      return updatedItem;
    } catch (err) {
      toast({
        title: "Update Failed",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  }, [toast]);

  const deleteTranscription = useCallback(async (id) => {
    try {
      const success = await transcriptionService.deleteTranscription(id);
      if (success) {
        toast({
          title: "Deleted",
          description: "Transcription removed from history."
        });
      }
      return success;
    } catch (err) {
      toast({
        title: "Delete Failed",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  }, [toast]);

  return {
    transcriptions,
    loading,
    error,
    refresh: fetchTranscriptions,
    saveTranscription,
    updateTranscription,
    deleteTranscription
  };
};
