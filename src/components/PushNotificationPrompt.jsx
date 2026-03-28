import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { pushNotificationService } from '@/services/pushNotificationService';
import { cn } from '@/lib/utils';

const DISMISSED_KEY = 'munal_push_prompt_dismissed';

const PushNotificationPrompt = () => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!pushNotificationService.isSupported()) return;

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const permission = pushNotificationService.getPermission();
    if (permission === 'granted') {
      // Already granted — silently subscribe in case not stored
      pushNotificationService.subscribe(user.id);
      return;
    }
    if (permission === 'denied') return;

    // Show prompt after 3s delay
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, [user]);

  const handleEnable = async () => {
    setSubscribing(true);
    const sub = await pushNotificationService.subscribe(user.id);
    setSubscribing(false);
    if (sub) {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  };

  if (!show) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-sm w-full',
        'bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700',
        'p-4 animate-in slide-in-from-bottom-5 fade-in duration-300',
      )}
      data-testid="push-notification-prompt"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        data-testid="push-prompt-dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Enable Push Notifications</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Get instant alerts for time-off requests, shift swaps, and team updates — even when you&apos;re on a different page.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={subscribing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7 px-3"
              data-testid="push-prompt-enable"
            >
              {subscribing ? 'Enabling...' : 'Enable'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-xs h-7 px-3 text-gray-500"
              data-testid="push-prompt-later"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationPrompt;
