import React, { useState, useEffect } from 'react';
import { Bell, Clock, Mail, MessageSquare, Smartphone, Check, Plus, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const API_URL = import.meta.env.REACT_APP_BACKEND_URL || '';

const REMINDER_OPTIONS = [
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' }
];

const ShiftReminderSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    enabled: true,
    reminder_times: [15, 60],
    push_enabled: true,
    email_enabled: false,
    sms_enabled: false
  });

  useEffect(() => {
    if (user?.id) {
      fetchPreferences();
    }
  }, [user?.id]);

  const fetchPreferences = async () => {
    try {
      const res = await fetch(`${API_URL}/api/shift-reminders/user/${user.id}/preferences`);
      const data = await res.json();
      if (data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPrefs) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/shift-reminders/user/${user.id}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs)
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: 'Settings saved',
          description: 'Your reminder preferences have been updated.'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save preferences'
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = () => {
    const newPrefs = { ...preferences, enabled: !preferences.enabled };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  const toggleReminderTime = (minutes) => {
    const newTimes = preferences.reminder_times.includes(minutes)
      ? preferences.reminder_times.filter(t => t !== minutes)
      : [...preferences.reminder_times, minutes].sort((a, b) => a - b);
    
    const newPrefs = { ...preferences, reminder_times: newTimes };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  const toggleChannel = (channel) => {
    const newPrefs = { ...preferences, [channel]: !preferences[channel] };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
              <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Shift Reminders</CardTitle>
              <CardDescription>Get notified before your shifts start</CardDescription>
            </div>
          </div>
          <Switch
            checked={preferences.enabled}
            onCheckedChange={toggleEnabled}
            disabled={saving}
          />
        </div>
      </CardHeader>
      
      <CardContent className={cn("space-y-6", !preferences.enabled && "opacity-50 pointer-events-none")}>
        {/* Reminder Times */}
        <div className="space-y-3">
          <label className="text-sm font-medium">When to remind me</label>
          <div className="flex flex-wrap gap-2">
            {REMINDER_OPTIONS.map((option) => {
              const isSelected = preferences.reminder_times.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => toggleReminderTime(option.value)}
                  disabled={saving}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors",
                    isSelected
                      ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  <Clock className="w-3.5 h-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500">
            Select multiple times to receive multiple reminders
          </p>
        </div>

        {/* Notification Channels */}
        <div className="space-y-3">
          <label className="text-sm font-medium">How to notify me</label>
          <div className="space-y-2">
            <NotificationChannel
              icon={Smartphone}
              label="Push Notifications"
              description="Receive instant alerts on your device"
              checked={preferences.push_enabled}
              onChange={() => toggleChannel('push_enabled')}
              disabled={saving}
            />
            <NotificationChannel
              icon={Mail}
              label="Email"
              description="Get reminders in your inbox"
              checked={preferences.email_enabled}
              onChange={() => toggleChannel('email_enabled')}
              disabled={saving}
            />
            <NotificationChannel
              icon={MessageSquare}
              label="SMS"
              description="Text message reminders"
              checked={preferences.sms_enabled}
              onChange={() => toggleChannel('sms_enabled')}
              disabled={saving}
              badge="Premium"
            />
          </div>
        </div>

        {/* Preview */}
        {preferences.enabled && preferences.reminder_times.length > 0 && (
          <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Preview:</strong> You&apos;ll receive reminders{' '}
              {preferences.reminder_times.map((t, i) => {
                const option = REMINDER_OPTIONS.find(o => o.value === t);
                const isLast = i === preferences.reminder_times.length - 1;
                const isSecondLast = i === preferences.reminder_times.length - 2;
                return (
                  <span key={t}>
                    <strong>{option?.label}</strong>
                    {!isLast && (isSecondLast ? ' and ' : ', ')}
                  </span>
                );
              })}{' '}
              via{' '}
              {[
                preferences.push_enabled && 'push',
                preferences.email_enabled && 'email',
                preferences.sms_enabled && 'SMS'
              ].filter(Boolean).join(', ') || 'no channels selected'}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper component for notification channels
const NotificationChannel = ({ icon: Icon, label, description, checked, onChange, disabled, badge }) => (
  <div 
    className={cn(
      "flex items-center gap-4 p-3 rounded-lg transition-colors cursor-pointer",
      "hover:bg-gray-50 dark:hover:bg-slate-800",
      checked && "bg-indigo-50/50 dark:bg-indigo-900/10"
    )}
    onClick={onChange}
  >
    <div className={cn(
      "p-2 rounded-full",
      checked 
        ? "bg-indigo-100 dark:bg-indigo-900/30" 
        : "bg-gray-100 dark:bg-gray-800"
    )}>
      <Icon className={cn(
        "w-4 h-4",
        checked ? "text-indigo-600" : "text-gray-500"
      )} />
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm">{label}</span>
        {badge && (
          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
            {badge}
          </Badge>
        )}
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
    <Switch
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

export default ShiftReminderSettings;
