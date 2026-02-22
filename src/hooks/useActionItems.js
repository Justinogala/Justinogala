
import { useState, useCallback } from 'react';
import { actionItemsService } from '@/services/actionItemsService';
import { useToast } from '@/components/ui/use-toast';

export const useActionItems = (initialItems = []) => {
  const [actionItems, setActionItems] = useState(initialItems || []);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const extractActionItems = useCallback(async (transcriptionText) => {
    if (!transcriptionText) return;

    setLoading(true);
    try {
      const items = await actionItemsService.extractActionItems(transcriptionText);
      setActionItems(items);
      toast({
        title: "Action Items Extracted",
        description: `Found ${items.length} action items from the meeting.`
      });
      return items;
    } catch (err) {
      toast({
        title: "Extraction Failed",
        description: "Could not extract action items.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addActionItem = useCallback((itemData) => {
    const newItem = actionItemsService.createActionItem(itemData);
    setActionItems(prev => [...prev, newItem]);
    toast({ title: "Added", description: "New action item created." });
    return newItem;
  }, [toast]);

  const updateActionItem = useCallback((updatedItem) => {
    setActionItems(prev => actionItemsService.updateActionItem(prev, updatedItem));
    toast({ title: "Updated", description: "Action item updated." });
  }, [toast]);

  const deleteActionItem = useCallback((itemId) => {
    setActionItems(prev => actionItemsService.deleteActionItem(prev, itemId));
    toast({ title: "Deleted", description: "Action item removed." });
  }, [toast]);

  const toggleComplete = useCallback((itemId) => {
    setActionItems(prev => actionItemsService.toggleComplete(prev, itemId));
  }, []);

  return {
    actionItems,
    loading,
    extractActionItems,
    addActionItem,
    updateActionItem,
    deleteActionItem,
    toggleComplete,
    setActionItems // Allow manual setting if loading from saved state
  };
};
