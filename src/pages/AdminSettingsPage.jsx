import React, { useState, useEffect, useCallback } from 'react';
import { getSettings, updateSettings, resetToDefaults, testEmailConnection, testAPIConnection, DEFAULT_SETTINGS } from '@/services/adminSettingsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Save, Lock, Mail, Globe, Shield, Bell, Settings, RefreshCw, Loader2, CheckCircle, TestTube } from 'lucide-react';
import { motion } from 'framer-motion';

// SaveButton component moved outside to avoid nested component issue
const SaveButton = ({ section, saving, onSave }) => (
  <Button 
    onClick={() => onSave(section)} 
    disabled={saving[section]}
    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
  >
    {saving[section] ? (
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
    ) : (
      <Save className="w-4 h-4 mr-2" />
    )}
    {saving[section] ? 'Saving...' : 'Save Settings'}
  </Button>
);

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [testing, setTesting] = useState({});
  const { toast } = useToast();

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load settings.", variant: "destructive" });
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleUpdate = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleSave = async (section) => {
    setSaving(prev => ({ ...prev, [section]: true }));
    try {
      const result = await updateSettings(section, settings[section]);
      if (result.success) {
        toast({ 
          title: "Settings Saved", 
          description: (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>{section.charAt(0).toUpperCase() + section.slice(1)} configuration saved to database.</span>
            </div>
          )
        });
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
      toast({ title: "Error", description: `Failed to save ${section} settings.`, variant: "destructive" });
    } finally {
      setSaving(prev => ({ ...prev, [section]: false }));
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      await resetToDefaults();
      setSettings(DEFAULT_SETTINGS);
      toast({ title: "Settings Reset", description: "All settings have been reset to defaults." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to reset settings.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(prev => ({ ...prev, email: true }));
    try {
      const result = await testEmailConnection(settings.email);
      toast({ 
        title: result.success ? "Connection Successful" : "Connection Failed", 
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } finally {
      setTesting(prev => ({ ...prev, email: false }));
    }
  };

  const handleTestAPI = async () => {
    setTesting(prev => ({ ...prev, api: true }));
    try {
      const result = await testAPIConnection(settings.api?.openaiKey);
      toast({ 
        title: result.success ? "API Connected" : "API Error", 
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } finally {
      setTesting(prev => ({ ...prev, api: false }));
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <span className="ml-3 text-gray-400">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage global application configuration</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetDefaults} className="border-gray-700 text-gray-400 hover:text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Defaults
          </Button>
          <Button variant="outline" className="border-violet-500/50 text-violet-400 bg-violet-500/10">
            <CheckCircle className="w-4 h-4 mr-2" />
            Saved
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-slate-900/50 border border-white/10 w-full justify-start overflow-x-auto backdrop-blur-sm">
          <TabsTrigger value="general" className="data-[state=active]:bg-violet-600">General</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-violet-600">Security</TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-violet-600">Email</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-violet-600">Notifications</TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-violet-600">System</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-slate-900/50 border-white/10 mt-4 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  General Configuration
                </CardTitle>
                <CardDescription>Basic application information and branding.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Application Name</Label>
                    <Input 
                      value={settings.general.appName} 
                      onChange={(e) => handleUpdate('general', 'appName', e.target.value)}
                      className="bg-slate-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Support Email</Label>
                    <Input 
                      value={settings.general.supportEmail} 
                      onChange={(e) => handleUpdate('general', 'supportEmail', e.target.value)}
                      className="bg-slate-800 border-gray-700"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Website URL</Label>
                    <Input 
                      value={settings.general.websiteUrl} 
                      onChange={(e) => handleUpdate('general', 'websiteUrl', e.target.value)}
                      className="bg-slate-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Timezone</Label>
                    <Input 
                      value={settings.general.timezone} 
                      onChange={(e) => handleUpdate('general', 'timezone', e.target.value)}
                      className="bg-slate-800 border-gray-700"
                      placeholder="UTC"
                    />
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <SaveButton section="general" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-slate-900/50 border-white/10 mt-4 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  Security Policy
                </CardTitle>
                <CardDescription>Access control and session management settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Minimum Password Length</Label>
                    <Input 
                      type="number"
                      value={settings.security.minPasswordLength} 
                      onChange={(e) => handleUpdate('security', 'minPasswordLength', parseInt(e.target.value))}
                      className="bg-slate-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Session Timeout (minutes)</Label>
                    <Input 
                      type="number"
                      value={settings.security.sessionTimeout} 
                      onChange={(e) => handleUpdate('security', 'sessionTimeout', parseInt(e.target.value))}
                      className="bg-slate-800 border-gray-700"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Max Login Attempts</Label>
                    <Input 
                      type="number"
                      value={settings.security.maxLoginAttempts} 
                      onChange={(e) => handleUpdate('security', 'maxLoginAttempts', parseInt(e.target.value))}
                      className="bg-slate-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Lockout Duration (minutes)</Label>
                    <Input 
                      type="number"
                      value={settings.security.lockoutDuration} 
                      onChange={(e) => handleUpdate('security', 'lockoutDuration', parseInt(e.target.value))}
                      className="bg-slate-800 border-gray-700"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-gray-700">
                  <div>
                    <Label className="text-gray-300">Enable Two-Factor Authentication</Label>
                    <p className="text-xs text-gray-500 mt-1">Require 2FA for all admin accounts</p>
                  </div>
                  <Switch 
                    checked={settings.security.enable2FA}
                    onCheckedChange={(checked) => handleUpdate('security', 'enable2FA', checked)}
                  />
                </div>
                <div className="pt-4 flex justify-end">
                  <SaveButton section="security" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-slate-900/50 border-white/10 mt-4 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    SMTP Configuration
                  </CardTitle>
                  <CardDescription>Settings for outgoing transactional emails.</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleTestEmail}
                  disabled={testing.email}
                  className="border-gray-700"
                >
                  {testing.email ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4 mr-2" />
                  )}
                  Test Email
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">SMTP Host</Label>
                    <Input 
                      value={settings.email.smtpHost} 
                      onChange={(e) => handleUpdate('email', 'smtpHost', e.target.value)}
                      className="bg-slate-800 border-gray-700"
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">SMTP Port</Label>
                    <Input 
                      type="number"
                      value={settings.email.smtpPort} 
                      onChange={(e) => handleUpdate('email', 'smtpPort', parseInt(e.target.value))}
                      className="bg-slate-800 border-gray-700"
                      placeholder="587"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Username</Label>
                  <Input 
                    value={settings.email.smtpUser} 
                    onChange={(e) => handleUpdate('email', 'smtpUser', e.target.value)}
                    className="bg-slate-800 border-gray-700"
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Password</Label>
                  <Input 
                    type="password"
                    value={settings.email.smtpPassword || ''} 
                    onChange={(e) => handleUpdate('email', 'smtpPassword', e.target.value)}
                    className="bg-slate-800 border-gray-700"
                    placeholder="••••••••"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Sender Name</Label>
                    <Input 
                      value={settings.email.senderName} 
                      onChange={(e) => handleUpdate('email', 'senderName', e.target.value)}
                      className="bg-slate-800 border-gray-700"
                      placeholder="Munal System"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Sender Email</Label>
                    <Input 
                      value={settings.email.senderEmail || ''} 
                      onChange={(e) => handleUpdate('email', 'senderEmail', e.target.value)}
                      className="bg-slate-800 border-gray-700"
                      placeholder="noreply@munal.ai"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-gray-700">
                  <div>
                    <Label className="text-gray-300">Use TLS/SSL</Label>
                    <p className="text-xs text-gray-500 mt-1">Enable secure connection</p>
                  </div>
                  <Switch 
                    checked={settings.email.useTLS}
                    onCheckedChange={(checked) => handleUpdate('email', 'useTLS', checked)}
                  />
                </div>
                <div className="pt-4 flex justify-end">
                  <SaveButton section="email" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-slate-900/50 border-white/10 mt-4 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  Notification Settings
                </CardTitle>
                <CardDescription>Configure how the system sends notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-gray-700">
                  <div>
                    <Label className="text-gray-300">Email Notifications</Label>
                    <p className="text-xs text-gray-500 mt-1">Send system alerts via email</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => handleUpdate('notifications', 'emailNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-gray-700">
                  <div>
                    <Label className="text-gray-300">Push Notifications</Label>
                    <p className="text-xs text-gray-500 mt-1">Enable browser push notifications</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) => handleUpdate('notifications', 'pushNotifications', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Slack Webhook URL</Label>
                  <Input 
                    value={settings.notifications.slackWebhook || ''} 
                    onChange={(e) => handleUpdate('notifications', 'slackWebhook', e.target.value)}
                    className="bg-slate-800 border-gray-700"
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Discord Webhook URL</Label>
                  <Input 
                    value={settings.notifications.discordWebhook || ''} 
                    onChange={(e) => handleUpdate('notifications', 'discordWebhook', e.target.value)}
                    className="bg-slate-800 border-gray-700"
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                </div>
                <div className="pt-4 flex justify-end">
                  <SaveButton section="notifications" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-slate-900/50 border-white/10 mt-4 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-slate-500 to-gray-500">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  System Configuration
                </CardTitle>
                <CardDescription>Advanced system and maintenance settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-red-950/30 border border-red-500/30">
                  <div>
                    <Label className="text-red-400">Maintenance Mode</Label>
                    <p className="text-xs text-gray-500 mt-1">Temporarily disable public access</p>
                  </div>
                  <Switch 
                    checked={settings.system.maintenanceMode}
                    onCheckedChange={(checked) => handleUpdate('system', 'maintenanceMode', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-gray-700">
                  <div>
                    <Label className="text-gray-300">Debug Mode</Label>
                    <p className="text-xs text-gray-500 mt-1">Enable verbose logging</p>
                  </div>
                  <Switch 
                    checked={settings.system.debugMode}
                    onCheckedChange={(checked) => handleUpdate('system', 'debugMode', checked)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Max Upload Size (MB)</Label>
                    <Input 
                      type="number"
                      value={settings.system.maxUploadSize} 
                      onChange={(e) => handleUpdate('system', 'maxUploadSize', parseInt(e.target.value))}
                      className="bg-slate-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Log Level</Label>
                    <Input 
                      value={settings.system.logLevel} 
                      onChange={(e) => handleUpdate('system', 'logLevel', e.target.value)}
                      className="bg-slate-800 border-gray-700"
                      placeholder="info"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Allowed File Types</Label>
                  <Input 
                    value={settings.system.allowedFileTypes} 
                    onChange={(e) => handleUpdate('system', 'allowedFileTypes', e.target.value)}
                    className="bg-slate-800 border-gray-700"
                    placeholder="pdf,doc,docx,txt,mp3,wav,mp4"
                  />
                </div>
                <div className="pt-4 flex justify-end">
                  <SaveButton section="system" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettingsPage;
