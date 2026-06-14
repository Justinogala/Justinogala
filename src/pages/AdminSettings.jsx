import React, { useState, useEffect, useCallback } from 'react';
import { Save, RefreshCw, Undo, Loader2, CheckCircle, AlertCircle, Clock, MessageSquare, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageTransition from '@/components/PageTransition';
import { useToast } from '@/components/ui/use-toast';
import { adminSettingsPersistenceService } from '@/services/adminSettingsPersistenceService';
import SettingsStatusBadge from '@/components/admin/SettingsStatusBadge';
import { getApiUrl } from '@/lib/api';

const AdminSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [originalSettings, setOriginalSettings] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const API = getApiUrl();

  // SMS notification settings
  const [smsConfig, setSmsConfig] = useState({
    provider: 'telegram', enabled: false,
    telegram_bot_token: '', telegram_bot_name: '',
    twilio_account_sid: '', twilio_auth_token: '', twilio_phone_number: '',
    vonage_api_key: '', vonage_api_secret: '', vonage_from_number: '',
    msg91_auth_key: '', msg91_sender_id: '', msg91_template_id: '',
  });
  const [smsSaving, setSmsSaving] = useState(false);
  const [smsTesting, setSmsTesting] = useState(false);
  const [testChatId, setTestChatId] = useState('');

  // Load SMS config
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    fetch(`${API}/api/admin/sms`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setSmsConfig(prev => ({ ...prev, ...data })); })
      .catch(() => {});
  }, []);

  const saveSmsConfig = async () => {
    setSmsSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API}/api/admin/sms`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(smsConfig),
      });
      if (res.ok) toast({ title: "SMS Settings Saved", description: `Provider: ${smsConfig.provider}` });
      else toast({ title: "Error", description: "Failed to save SMS config", variant: "destructive" });
    } catch { toast({ title: "Error", description: "Network error", variant: "destructive" }); }
    setSmsSaving(false);
  };

  const sendTestSms = async () => {
    if (!testChatId.trim()) { toast({ title: "Enter a Chat ID", variant: "destructive" }); return; }
    setSmsTesting(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API}/api/admin/sms/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ chat_id: testChatId }),
      });
      const data = await res.json();
      if (res.ok) toast({ title: "Test Sent!", description: data.message });
      else toast({ title: "Failed", description: data.detail || "Could not send test", variant: "destructive" });
    } catch { toast({ title: "Error", description: "Network error", variant: "destructive" }); }
    setSmsTesting(false);
  };

  // Load settings on mount
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSettingsPersistenceService.getAllSettings();
      setSettings(data);
      setOriginalSettings(JSON.parse(JSON.stringify(data))); // Deep copy for comparison
      
      const lastSavedTs = await adminSettingsPersistenceService.getLastSaved();
      setLastSaved(lastSavedTs);
      
      // Apply immediate effects
      adminSettingsPersistenceService.applySettings(data);
      
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast({
        title: "Error Loading Settings",
        description: "Could not retrieve saved configuration.",
        variant: "destructive"
      });
      // Use defaults on error
      const defaults = adminSettingsPersistenceService.getDefaults();
      setSettings(defaults);
      setOriginalSettings(JSON.parse(JSON.stringify(defaults)));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleFieldChange = (section, field, value) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };
      
      // Check if dirty by comparing with original
      const hasChanges = JSON.stringify(newSettings) !== JSON.stringify(originalSettings);
      setIsDirty(hasChanges);
      
      return newSettings;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save all settings to MongoDB
      const results = await adminSettingsPersistenceService.saveAllSettings(settings);
      
      // Check for errors
      const hasErrors = Object.values(results).some(r => !r.success);
      if (hasErrors) {
        throw new Error('Some settings failed to save');
      }
      
      adminSettingsPersistenceService.applySettings(settings);
      
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      setLastSaved(new Date());
      setIsDirty(false);
      
      toast({
        title: "Settings Saved to Database",
        description: "All configuration changes have been permanently saved.",
        className: "bg-green-500 text-white border-none"
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm("Discard all unsaved changes?")) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)));
      setIsDirty(false);
      toast({ title: "Changes Discarded", description: "Reverted to last saved configuration." });
    }
  };

  const handleReset = async () => {
    if (window.confirm("Reset ALL settings to system defaults? This cannot be undone.")) {
      try {
        const defaults = await adminSettingsPersistenceService.resetSettings();
        setSettings(defaults);
        setOriginalSettings(defaults);
        setIsDirty(false);
        setLastSaved(null);
        toast({ title: "Factory Reset", description: "All settings restored to defaults and cleared from database." });
      } catch (error) {
        toast({ title: "Reset Failed", description: error.message, variant: "destructive" });
      }
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Settings
              {lastSaved && (
                 <Badge variant="outline" className="text-xs font-normal text-muted-foreground ml-2">
                   <Clock className="w-3 h-3 mr-1" />
                   Saved {lastSaved.toLocaleTimeString()}
                 </Badge>
              )}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage global application configuration</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {isDirty && (
              <Button variant="ghost" onClick={handleDiscard} disabled={saving} className="flex-1 sm:flex-none">
                <Undo className="w-4 h-4 mr-2" /> Discard
              </Button>
            )}
            <Button variant="outline" onClick={handleReset} disabled={saving} className="flex-1 sm:flex-none">
              <RefreshCw className="w-4 h-4 mr-2" /> Defaults
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!isDirty || saving} 
              className={`flex-1 sm:flex-none min-w-[140px] transition-all duration-200 ${
                isDirty ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : ''
              }`}
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : isDirty ? (
                <><Save className="w-4 h-4 mr-2" /> Save Changes</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" /> Saved</>
              )}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-8 h-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {['general', 'security', 'email', 'notifications', 'system'].map(tab => (
              <TabsTrigger key={tab} value={tab} className="capitalize py-2">
                {tab}
                {/* Show dot if section has changes */}
                {JSON.stringify(settings[tab]) !== JSON.stringify(originalSettings[tab]) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {/* General Settings */}
          <TabsContent value="general" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <div>
                    <CardTitle>General Information</CardTitle>
                    <CardDescription>Basic details about the application instance.</CardDescription>
                  </div>
                  <SettingsStatusBadge status="active" label="General" timestamp={lastSaved} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="appName">Application Name</Label>
                  <Input 
                    id="appName"
                    value={settings.general.appName} 
                    onChange={(e) => handleFieldChange('general', 'appName', e.target.value)}
                    placeholder="Enter app name"
                  />
                  <p className="text-[10px] text-muted-foreground">Will appear in browser tab title immediately.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input 
                      id="supportEmail"
                      value={settings.general.supportEmail}
                      onChange={(e) => handleFieldChange('general', 'supportEmail', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                     <Label htmlFor="supportPhone">Support Phone</Label>
                     <Input 
                        id="supportPhone"
                        value={settings.general.supportPhone}
                        onChange={(e) => handleFieldChange('general', 'supportPhone', e.target.value)}
                     />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card>
              <CardHeader>
                 <div className="flex justify-between">
                    <div>
                      <CardTitle>Security Configuration</CardTitle>
                      <CardDescription>Manage password policies and access controls.</CardDescription>
                    </div>
                    <SettingsStatusBadge status="active" label="Security" timestamp={lastSaved} />
                 </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2 max-w-md">
                  <Label>Session Timeout (minutes)</Label>
                  <Input 
                    type="number" 
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleFieldChange('security', 'sessionTimeout', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="grid gap-2 max-w-md">
                  <Label>Minimum Password Length</Label>
                  <Input 
                    type="number" 
                    value={settings.security.minPasswordLength}
                    onChange={(e) => handleFieldChange('security', 'minPasswordLength', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enforce 2FA for Admin Accounts</Label>
                    <p className="text-sm text-muted-foreground">Require two-factor authentication for all administrative users.</p>
                  </div>
                  <Switch 
                    checked={settings.security.enforce2FA}
                    onCheckedChange={(checked) => handleFieldChange('security', 'enforce2FA', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Email Settings */}
          <TabsContent value="email" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card>
              <CardHeader>
                 <div className="flex justify-between">
                    <div>
                      <CardTitle>SMTP Configuration</CardTitle>
                      <CardDescription>Settings for outgoing transactional emails.</CardDescription>
                    </div>
                    <SettingsStatusBadge status={settings.email.smtpHost ? 'active' : 'inactive'} label="Email" timestamp={lastSaved} />
                 </div>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>SMTP Host</Label>
                      <Input 
                        placeholder="smtp.example.com" 
                        value={settings.email.smtpHost}
                        onChange={(e) => handleFieldChange('email', 'smtpHost', e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>SMTP Port</Label>
                      <Input 
                        placeholder="587" 
                        value={settings.email.smtpPort}
                        onChange={(e) => handleFieldChange('email', 'smtpPort', e.target.value)}
                      />
                    </div>
                 </div>
                 <div className="grid gap-2">
                    <Label>Username</Label>
                    <Input 
                      placeholder="user@example.com" 
                      value={settings.email.username}
                      onChange={(e) => handleFieldChange('email', 'username', e.target.value)}
                    />
                 </div>
                 <div className="grid gap-2">
                    <Label>Password</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={settings.email.password}
                      onChange={(e) => handleFieldChange('email', 'password', e.target.value)}
                    />
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

           {/* Notification Settings */}
           <TabsContent value="notifications" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card>
              <CardHeader>
                 <div className="flex justify-between">
                    <div>
                      <CardTitle>Notifications</CardTitle>
                      <CardDescription>Control system-wide alert preferences.</CardDescription>
                    </div>
                    <SettingsStatusBadge status="active" label="Notifications" timestamp={lastSaved} />
                 </div>
              </CardHeader>
              <CardContent className="space-y-0 divide-y">
                  {[
                    { key: 'newSignup', label: 'New User Signup Alerts', desc: 'Receive emails when new users register.' },
                    { key: 'systemError', label: 'System Error Alerts', desc: 'Get notified about critical system failures.' },
                    { key: 'weeklyDigest', label: 'Weekly Report Digest', desc: 'Receive a summary of weekly activity.' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                       <div className="space-y-0.5">
                          <Label className="text-base">{item.label}</Label>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                       </div>
                       <Switch 
                          checked={settings.notifications[item.key]}
                          onCheckedChange={(checked) => handleFieldChange('notifications', item.key, checked)}
                       />
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* SMS / Messaging Settings */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" /> SMS & Messaging Settings</CardTitle>
                    <CardDescription>Configure SMS/messaging providers for phone notifications. Select a provider and enter credentials.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Enable</Label>
                    <Switch
                      checked={smsConfig.enabled}
                      onCheckedChange={(v) => setSmsConfig(p => ({ ...p, enabled: v }))}
                      data-testid="sms-enabled-toggle"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Provider Selection */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: 'telegram', name: 'Telegram', color: 'text-sky-500', desc: 'Free' },
                    { id: 'twilio', name: 'Twilio', color: 'text-red-500', desc: 'Paid' },
                    { id: 'vonage', name: 'Vonage', color: 'text-gray-700 dark:text-gray-300', desc: 'Paid' },
                    { id: 'msg91', name: 'MSG91', color: 'text-blue-600', desc: 'Paid' },
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSmsConfig(prev => ({ ...prev, provider: p.id }))}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        smsConfig.provider === p.id
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-sm'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                      }`}
                      data-testid={`sms-provider-${p.id}`}
                    >
                      <span className={`text-sm font-bold ${p.color}`}>{p.name}</span>
                      <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Telegram Config */}
                {smsConfig.provider === 'telegram' && (
                  <div className="space-y-4 p-4 rounded-xl bg-sky-50/50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-800/30">
                    <p className="text-xs text-sky-700 dark:text-sky-400 font-medium">Telegram is free — create a bot via @BotFather on Telegram to get your token.</p>
                    <div className="grid gap-2">
                      <Label>Telegram Bot Token *</Label>
                      <Input type="password" placeholder="123456:ABC-DEF1234..." value={smsConfig.telegram_bot_token}
                        onChange={e => setSmsConfig(p => ({ ...p, telegram_bot_token: e.target.value }))} data-testid="telegram-bot-token" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Telegram Bot Name</Label>
                      <Input placeholder="Munal Notifications" value={smsConfig.telegram_bot_name}
                        onChange={e => setSmsConfig(p => ({ ...p, telegram_bot_name: e.target.value }))} data-testid="telegram-bot-name" />
                    </div>
                  </div>
                )}

                {/* Twilio Config */}
                {smsConfig.provider === 'twilio' && (
                  <div className="space-y-4 p-4 rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30">
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">Twilio requires a paid account — get credentials at twilio.com/console</p>
                    <div className="grid gap-2">
                      <Label>Account SID</Label>
                      <Input placeholder="ACxxxxxxxx..." value={smsConfig.twilio_account_sid}
                        onChange={e => setSmsConfig(p => ({ ...p, twilio_account_sid: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Auth Token</Label>
                      <Input type="password" placeholder="Auth token..." value={smsConfig.twilio_auth_token}
                        onChange={e => setSmsConfig(p => ({ ...p, twilio_auth_token: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Phone Number</Label>
                      <Input placeholder="+1234567890" value={smsConfig.twilio_phone_number}
                        onChange={e => setSmsConfig(p => ({ ...p, twilio_phone_number: e.target.value }))} />
                    </div>
                  </div>
                )}

                {/* Vonage Config */}
                {smsConfig.provider === 'vonage' && (
                  <div className="space-y-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Vonage (Nexmo) — get credentials at dashboard.nexmo.com</p>
                    <div className="grid gap-2">
                      <Label>API Key</Label>
                      <Input placeholder="API key..." value={smsConfig.vonage_api_key}
                        onChange={e => setSmsConfig(p => ({ ...p, vonage_api_key: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>API Secret</Label>
                      <Input type="password" placeholder="API secret..." value={smsConfig.vonage_api_secret}
                        onChange={e => setSmsConfig(p => ({ ...p, vonage_api_secret: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>From Number</Label>
                      <Input placeholder="+1234567890" value={smsConfig.vonage_from_number}
                        onChange={e => setSmsConfig(p => ({ ...p, vonage_from_number: e.target.value }))} />
                    </div>
                  </div>
                )}

                {/* MSG91 Config */}
                {smsConfig.provider === 'msg91' && (
                  <div className="space-y-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">MSG91 — get credentials at msg91.com/signup</p>
                    <div className="grid gap-2">
                      <Label>Auth Key</Label>
                      <Input type="password" placeholder="Auth key..." value={smsConfig.msg91_auth_key}
                        onChange={e => setSmsConfig(p => ({ ...p, msg91_auth_key: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Sender ID</Label>
                      <Input placeholder="MUNALAI" value={smsConfig.msg91_sender_id}
                        onChange={e => setSmsConfig(p => ({ ...p, msg91_sender_id: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Template ID</Label>
                      <Input placeholder="Template ID..." value={smsConfig.msg91_template_id}
                        onChange={e => setSmsConfig(p => ({ ...p, msg91_template_id: e.target.value }))} />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button onClick={saveSmsConfig} disabled={smsSaving} data-testid="save-sms-btn">
                    {smsSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {smsSaving ? 'Saving...' : 'Save SMS Settings'}
                  </Button>
                  {smsConfig.provider === 'telegram' && smsConfig.enabled && (
                    <div className="flex items-center gap-2">
                      <Input placeholder="Telegram Chat ID" value={testChatId} onChange={e => setTestChatId(e.target.value)}
                        className="w-48" data-testid="test-chat-id" />
                      <Button variant="outline" onClick={sendTestSms} disabled={smsTesting} data-testid="send-test-sms-btn">
                        {smsTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Test
                      </Button>
                    </div>
                  )}
                </div>

                {smsConfig.provider === 'telegram' && (
                  <p className="text-xs text-gray-400">Tip: To get your Telegram Chat ID, message your bot and visit <code className="text-violet-500">api.telegram.org/bot[token]/getUpdates</code></p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

           {/* System Settings */}
           <TabsContent value="system" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card>
              <CardHeader>
                 <div className="flex justify-between">
                    <div>
                      <CardTitle>System Parameters</CardTitle>
                      <CardDescription>Technical configuration and limits.</CardDescription>
                    </div>
                    <SettingsStatusBadge status="active" label="System" timestamp={lastSaved} />
                 </div>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="grid gap-2">
                    <Label>Max Upload Size (MB)</Label>
                    <Input 
                      type="number" 
                      value={settings.system.maxUploadSize}
                      onChange={(e) => handleFieldChange('system', 'maxUploadSize', parseInt(e.target.value) || 0)}
                    />
                 </div>
                 <div className="grid gap-2">
                    <Label>API Rate Limit (req/min)</Label>
                    <Input 
                      type="number" 
                      value={settings.system.apiRateLimit}
                      onChange={(e) => handleFieldChange('system', 'apiRateLimit', parseInt(e.target.value) || 0)}
                    />
                 </div>
                 <div className="pt-6 mt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="text-base text-red-700 dark:text-red-400">Maintenance Mode</Label>
                        <p className="text-sm text-red-600/80 dark:text-red-400/70">Disable access for non-admin users.</p>
                      </div>
                      <Switch 
                        checked={settings.system.maintenanceMode}
                        onCheckedChange={(checked) => handleFieldChange('system', 'maintenanceMode', checked)}
                      />
                    </div>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
};

export default AdminSettings;