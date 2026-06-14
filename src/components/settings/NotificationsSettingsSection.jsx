
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Mail, Calendar, CheckSquare, Loader2, Send, MessageCircle } from 'lucide-react';
import { getApiUrl } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const NotificationsSettingsSection = () => {
  const { preferences, updateNotificationPreferences, loading } = useUserSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const API = getApiUrl();
  const [localPrefs, setLocalPrefs] = useState(preferences);

  // Telegram Chat ID state
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramSaving, setTelegramSaving] = useState(false);
  const [telegramTesting, setTelegramTesting] = useState(false);

  useEffect(() => { setLocalPrefs(preferences); }, [preferences]);

  // Load user's Telegram Chat ID
  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API}/api/users/${user.id}/telegram`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.telegram_chat_id) setTelegramChatId(data.telegram_chat_id); })
      .catch(() => {});
  }, [user?.id]);

  const handleToggle = (key) => {
    setLocalPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    updateNotificationPreferences(localPrefs);
  };

  const saveTelegramId = async () => {
    if (!user?.id) return;
    setTelegramSaving(true);
    try {
      const res = await fetch(`${API}/api/users/${user.id}/telegram`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_chat_id: telegramChatId }),
      });
      if (res.ok) toast({ title: "Saved", description: "Telegram Chat ID updated." });
      else toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } catch { toast({ title: "Error", description: "Network error", variant: "destructive" }); }
    setTelegramSaving(false);
  };

  const testTelegram = async () => {
    if (!telegramChatId.trim()) { toast({ title: "Enter your Chat ID first", variant: "destructive" }); return; }
    setTelegramTesting(true);
    try {
      const token = localStorage.getItem('admin_token') || JSON.parse(localStorage.getItem('munal_sessions') || '{}').token;
      const res = await fetch(`${API}/api/admin/sms/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ chat_id: telegramChatId }),
      });
      const data = await res.json();
      if (res.ok) toast({ title: "Test Sent!", description: "Check your Telegram for the message." });
      else toast({ title: "Failed", description: data.detail || "Could not send test. Ask admin to configure Telegram bot.", variant: "destructive" });
    } catch { toast({ title: "Error", description: "Network error", variant: "destructive" }); }
    setTelegramTesting(false);
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
    <>
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

    {/* Telegram Notifications Card */}
    <Card className="border-border shadow-sm mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-sky-500" />
          Telegram Notifications
        </CardTitle>
        <CardDescription>
          Link your Telegram account to receive instant notifications for meeting reminders, task assignments, and alerts directly on your phone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-xl bg-sky-50/50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-800/30 space-y-3">
          <div className="grid gap-2">
            <Label>Your Telegram Chat ID</Label>
            <Input
              placeholder="e.g., 123456789"
              value={telegramChatId}
              onChange={e => setTelegramChatId(e.target.value)}
              data-testid="user-telegram-chat-id"
            />
          </div>
          <p className="text-xs text-gray-400">
            To find your Chat ID: 1) Search for your admin's Munal bot on Telegram, 2) Send it any message, 3) Ask your admin for the Chat ID, or use <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline">@userinfobot</a>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={saveTelegramId} disabled={telegramSaving} data-testid="save-telegram-id-btn">
            {telegramSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {telegramSaving ? 'Saving...' : 'Save Chat ID'}
          </Button>
          {telegramChatId && (
            <Button variant="outline" onClick={testTelegram} disabled={telegramTesting} data-testid="test-telegram-btn">
              {telegramTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Send Test
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  </>
  );
};

export default NotificationsSettingsSection;
