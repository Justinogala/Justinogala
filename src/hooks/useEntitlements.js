import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { 
  checkEntitlement, 
  recordUsage,
  FEATURES 
} from '@/services/entitlementsService';

/**
 * Hook for checking and enforcing entitlements
 */
export const useEntitlements = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);

  /**
   * Check if user can use a feature
   * Returns { allowed, usage } or shows upgrade prompt
   */
  const canUse = useCallback(async (feature, amount = 1, showToast = true) => {
    if (!user?.id) {
      return { allowed: false, reason: 'Not authenticated' };
    }

    try {
      setChecking(true);
      const result = await checkEntitlement(user.id, feature, amount);
      
      if (!result.allowed && showToast) {
        toast({
          variant: 'destructive',
          title: 'Limit Reached',
          description: result.message,
          action: (
            <button 
              onClick={() => navigate('/pricing')}
              className="text-xs underline"
            >
              Upgrade
            </button>
          )
        });
      }
      
      return {
        allowed: result.allowed,
        currentUsage: result.current_usage,
        limit: result.limit,
        remaining: result.remaining,
        percentageUsed: result.percentage_used,
        message: result.message
      };
    } catch (error) {
      console.error('Entitlement check failed:', error);
      // Allow by default if check fails to not block users
      return { allowed: true, error: error.message };
    } finally {
      setChecking(false);
    }
  }, [user?.id, toast, navigate]);

  /**
   * Record usage and check limit in one call
   * Throws if limit exceeded
   */
  const useFeature = useCallback(async (feature, amount = 1, metadata = null) => {
    if (!user?.id) {
      throw new Error('Not authenticated');
    }

    try {
      setChecking(true);
      const result = await recordUsage(user.id, feature, amount, metadata);
      return result;
    } catch (error) {
      if (error.upgradeRequired) {
        toast({
          variant: 'destructive',
          title: 'Upgrade Required',
          description: error.message,
          action: (
            <button 
              onClick={() => navigate(error.upgradeUrl || '/pricing')}
              className="text-xs underline"
            >
              Upgrade Now
            </button>
          )
        });
      }
      throw error;
    } finally {
      setChecking(false);
    }
  }, [user?.id, toast, navigate]);

  /**
   * Helper functions for common features
   */
  const canStartMeeting = useCallback(() => canUse(FEATURES.MEETINGS), [canUse]);
  const canUseTranscription = useCallback((minutes) => canUse(FEATURES.TRANSCRIPTION, minutes), [canUse]);
  const canUploadFile = useCallback((sizeGB) => canUse(FEATURES.STORAGE, sizeGB), [canUse]);
  const canSendAIMessage = useCallback(() => canUse(FEATURES.AI_CHAT), [canUse]);
  const canCreateWorkspace = useCallback(() => canUse(FEATURES.WORKSPACES), [canUse]);

  /**
   * Record usage for common features
   */
  const recordMeeting = useCallback(() => useFeature(FEATURES.MEETINGS), [useFeature]);
  const recordTranscription = useCallback((minutes) => useFeature(FEATURES.TRANSCRIPTION, minutes), [useFeature]);
  const recordAIMessage = useCallback(() => useFeature(FEATURES.AI_CHAT), [useFeature]);

  return {
    checking,
    canUse,
    useFeature,
    // Convenience methods
    canStartMeeting,
    canUseTranscription,
    canUploadFile,
    canSendAIMessage,
    canCreateWorkspace,
    recordMeeting,
    recordTranscription,
    recordAIMessage,
    // Feature constants
    FEATURES
  };
};

export default useEntitlements;
