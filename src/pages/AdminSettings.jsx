import React, { useState, useEffect, useCallback } from 'react';
import { Save, RefreshCw, Undo, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import PageTransition from '@/components/PageTransition';
import { useToast } from '@/components/ui/use-toast';
import { adminSettingsPersistenceService } from '@/services/adminSettingsPersistenceService';
import SettingsStatusBadge from '@/components/admin/SettingsStatusBadge';

const AdminSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [originalSettings, setOriginalSettings] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [activeTab, setActiveTab] = useState("general");

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
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      adminSettingsPersistenceService.saveAllSettings(settings);
      adminSettingsPersistenceService.applySettings(settings);
      
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      setLastSaved(new Date());
      setIsDirty(false);
      
      toast({
        title: "Settings Saved Successfully",
        description: "All configuration changes have been applied.",
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

  const handleReset = () => {
    if (window.confirm("Reset ALL settings to system defaults? This cannot be undone.")) {
      const defaults = adminSettingsPersistenceService.resetSettings();
      setSettings(defaults);
      setOriginalSettings(defaults);
      setIsDirty(false);
      setLastSaved(null);
      toast({ title: "Factory Reset", description: "All settings restored to defaults." });
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