
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Bell, BellOff, Volume2, Smartphone, Mail, MessageSquare } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { pushNotificationService } from '@/services/pushNotificationService';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// Reusable toggle item component for mobile-friendly touch targets - moved outside
const ToggleItem = ({ icon: Icon, iconColor, title, description, checked, onCheckedChange, disabled }) => (
  <div 
    className={cn(
      "flex items-center gap-4 p-4 -mx-4 rounded-xl transition-colors",
      "active:bg-gray-50 dark:active:bg-slate-800",
      disabled && "opacity-50"
    )}
    onClick={() => !disabled && onCheckedChange(!checked)}
  >
    <div className={cn("p-2.5 rounded-full shrink-0", iconColor)}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <label className="text-sm font-medium leading-none cursor-pointer">
        {title}
      </label>
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
        {description}
      </p>
    </div>
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className="shrink-0"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

const NotificationSettings = () => {
  const [permission, setPermission] = useState(() => {
    // Initialize from browser state synchronously
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });
  const [subscribed, setSubscribed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check subscription status asynchronously
    if ('serviceWorker' in navigator) {
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
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-full">
              <BellOff className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <CardTitle className="text-base">Push Notifications</CardTitle>
              <CardDescription className="text-sm">Not supported in this browser.</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-full">
            <Bell className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <CardTitle className="text-lg">Notifications</CardTitle>
            <CardDescription className="text-sm">
              Manage how you want to be notified
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
        <ToggleItem
          icon={Smartphone}
          iconColor="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          title="Push Notifications"
          description="Receive alerts for meeting summaries and action items on this device."
          checked={subscribed && permission === 'granted'}
          onCheckedChange={handleToggleNotifications}
          disabled={permission === 'denied'}
        />

        <div className="border-t border-gray-100 dark:border-gray-800" />

        <ToggleItem
          icon={Volume2}
          iconColor="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          title="Notification Sound"
          description="Play a sound when a notification is received."
          checked={soundEnabled}
          onCheckedChange={setSoundEnabled}
        />

        <div className="border-t border-gray-100 dark:border-gray-800" />

        <ToggleItem
          icon={Mail}
          iconColor="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
          title="Email Notifications"
          description="Receive important updates via email."
          checked={emailNotifications}
          onCheckedChange={setEmailNotifications}
        />

        <div className="border-t border-gray-100 dark:border-gray-800" />

        <ToggleItem
          icon={MessageSquare}
          iconColor="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
          title="SMS Notifications"
          description="Get critical alerts via text message."
          checked={smsNotifications}
          onCheckedChange={setSmsNotifications}
        />

        {permission === 'denied' && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm flex items-start gap-3">
            <BellOff className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Push notifications blocked</p>
              <p className="mt-1 text-red-500 dark:text-red-400">
                Please check your browser settings to enable notifications for this site.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
