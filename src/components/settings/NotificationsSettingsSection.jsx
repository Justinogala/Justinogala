
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Bell, Mail, Calendar, CheckSquare, Loader2 } from 'lucide-react';

const NotificationsSettingsSection = () => {
  const { preferences, updateNotificationPreferences, loading } = useUserSettings();
  const [localPrefs, setLocalPrefs] = useState(preferences);

  // Sync with hook state on mount or change
  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleToggle = (key) => {
    setLocalPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    updateNotificationPreferences(localPrefs);
  };

  const NotificationItem = ({ icon: Icon, title, description, checked, onCheckedChange }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg mt-1">
          <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="space-y-1">
          <Label className="text-base font-medium cursor-pointer" onClick={() => onCheckedChange(!checked)}>
            {title}
          </Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-500" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how and when you want to receive updates from Munal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <NotificationItem
          icon={Mail}
          title="Email Notifications"
          description="Receive important updates and alerts via email."
          checked={localPrefs.emailNotifications}
          onCheckedChange={() => handleToggle('emailNotifications')}
        />
        <NotificationItem
          icon={Calendar}
          title="Meeting Reminders"
          description="Get notified 10 minutes before your scheduled meetings start."
          checked={localPrefs.meetingReminders}
          onCheckedChange={() => handleToggle('meetingReminders')}
        />
        <NotificationItem
          icon={CheckSquare}
          title="Action Item Alerts"
          description="Receive immediate alerts when you are assigned a new task."
          checked={localPrefs.actionItemAlerts}
          onCheckedChange={() => handleToggle('actionItemAlerts')}
        />
        <NotificationItem
          icon={Bell}
          title="Summary Ready"
          description="Get notified as soon as your meeting transcript and summary are ready."
          checked={localPrefs.summaryNotifications}
          onCheckedChange={() => handleToggle('summaryNotifications')}
        />
        <NotificationItem
          icon={Mail}
          title="Weekly Digest"
          description="A weekly summary of your meeting stats and team activity."
          checked={localPrefs.weeklyDigest}
          onCheckedChange={() => handleToggle('weeklyDigest')}
        />
      </CardContent>
      <CardFooter className="flex justify-end border-t bg-gray-50/50 dark:bg-slate-900/50 px-6 py-4">
        <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NotificationsSettingsSection;
