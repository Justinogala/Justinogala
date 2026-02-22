
import { useState, useCallback } from 'react';
import { smartInsightsService } from '@/services/smartInsightsService';
import { useToast } from '@/components/ui/use-toast';

export const useSmartInsights = (initialInsights = null) => {
  const [insights, setInsights] = useState(initialInsights);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const generateInsights = useCallback(async (transcriptionText) => {
    if (!transcriptionText) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await smartInsightsService.generateInsights(transcriptionText);
      setInsights(data);
      toast({
        title: "Insights Generated",
        description: "AI has successfully analyzed the transcription."
      });
      return data;
    } catch (err) {
      setError(err.message);
      toast({
        title: "Generation Failed",
        description: "Could not generate insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const regenerateSection = useCallback(async (section, transcriptionText) => {
    if (!insights) return;

    // Local loading state could be handled here if we wanted granular loaders
    try {
      const newContent = await smartInsightsService.regenerateSection(section, transcriptionText);
      setInsights(prev => ({
        ...prev,
        [section]: newContent
      }));
      toast({
        title: "Updated",
        description: `${section} has been regenerated.`
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to regenerate section.",
        variant: "destructive"
      });
    }
  }, [insights, toast]);

  return {
    insights,
    loading,
    error,
    generateInsights,
    regenerateSection,
    setInsights // Allow manual setting if loading from saved state
  };
};
