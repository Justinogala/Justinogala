
import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Settings, Check, Volume2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { pushNotificationService } from '@/services/pushNotificationService';
import { useToast } from '@/components/ui/use-toast';

const NotificationSettings = () => {
  const [permission, setPermission] = useState('default');
  const [subscribed, setSubscribed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      // Check subscription status
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setSubscribed(!!sub);
        });
      });
    }
  }, []);

  const handleToggleNotifications = async (enabled) => {
    if (enabled) {
      if (permission === 'denied') {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive"
        });
        return;
      }

      const result = await pushNotificationService.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        const sub = await pushNotificationService.subscribe();
        if (sub) {
          setSubscribed(true);
          toast({
            title: "Notifications Enabled",
            description: "You will now receive updates about your meetings and transcriptions.",
          });
        }
      }
    } else {
      await pushNotificationService.unsubscribe();
      setSubscribed(false);
      toast({
        title: "Notifications Disabled",
        description: "You have unsubscribed from push notifications.",
      });
    }
  };

  if (!pushNotificationService.isSupported()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Push Notifications</CardTitle>
          <CardDescription>Not supported in this browser.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-violet-600" />
          <CardTitle className="text-lg">Notifications</CardTitle>
        </div>
        <CardDescription>
          Manage how you want to be notified about meeting updates and transcriptions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Push Notifications
            </label>
            <p className="text-xs text-muted-foreground">
              Receive alerts for meeting summaries and action items.
            </p>
          </div>
          <Switch
            checked={subscribed && permission === 'granted'}
            onCheckedChange={handleToggleNotifications}
            disabled={permission === 'denied'}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-medium leading-none">
              Notification Sound
            </label>
            <p className="text-xs text-muted-foreground">
              Play a sound when a notification is received.
            </p>
          </div>
          <Switch
            checked={soundEnabled}
            onCheckedChange={setSoundEnabled}
          />
        </div>

        {permission === 'denied' && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
            Notifications are blocked by your browser. Please check your address bar settings to enable them.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
