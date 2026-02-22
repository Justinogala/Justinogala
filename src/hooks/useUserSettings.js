
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

export const useUserSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock initial state - in a real app, this would come from an API
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    meetingReminders: true,
    summaryNotifications: true,
    actionItemAlerts: false,
    weeklyDigest: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: false,
    meetingSharing: true,
    transcriptSharing: false,
    dataAnalytics: true,
  });

  const updatePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Basic validation simulation
      if (currentPassword === 'wrong') {
        throw new Error("Incorrect current password");
      }
      
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
      return true;
    } catch (err) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message || "Could not update password.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationPreferences = async (newPreferences) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPreferences(newPreferences);
      toast({
        title: "Preferences Saved",
        description: "Your notification settings have been updated.",
      });
      return true;
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save preferences.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updatePrivacySettings = async (newSettings) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPrivacySettings(newSettings);
      toast({
        title: "Privacy Settings Saved",
        description: "Your privacy preferences have been updated.",
      });
      return true;
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save privacy settings.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (confirmationEmail) => {
    setLoading(true);
    try {
      if (confirmationEmail !== user?.email) {
        throw new Error("Email does not match");
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      return true;
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: err.message || "Could not delete account.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const exportUserData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Export Started",
        description: "Your data is being prepared. You will receive an email shortly.",
      });
      return true;
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not initiate data export.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    preferences,
    privacySettings,
    updatePassword,
    updateNotificationPreferences,
    updatePrivacySettings,
    deleteAccount,
    exportUserData,
  };
};
