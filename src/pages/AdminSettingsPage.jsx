
import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/services/adminSettingsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Save, Lock, Mail, Globe, Shield } from 'lucide-react';

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setSettings(getSettings());
    setLoading(false);
  }, []);

  const handleUpdate = (section, key, value) => {
    const updated = { ...settings };
    updated[section][key] = value;
    setSettings(updated);
  };

  const handleSave = async (section) => {
    try {
      updateSettings(section, settings[section]);
      toast({ title: "Settings Saved", description: `${section} configuration updated successfully.` });
    } catch (e) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    }
  };

  if (loading || !settings) return <div className="text-white p-8">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <p className="text-gray-400 text-sm">Configure global application parameters.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-slate-900 border border-white/10 w-full justify-start overflow-x-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api">API & Integrations</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="bg-slate-900 border-white/10 mt-4">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Globe className="w-5 h-5" /> General Configuration</CardTitle>
              <CardDescription>Basic application information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input 
                label="Application Name" 
                value={settings.general.appName} 
                onChange={(e) => handleUpdate('general', 'appName', e.target.value)} 
              />
              <Input 
                label="Support Email" 
                value={settings.general.supportEmail} 
                onChange={(e) => handleUpdate('general', 'supportEmail', e.target.value)} 
              />
              <Input 
                label="Website URL" 
                value={settings.general.websiteUrl} 
                onChange={(e) => handleUpdate('general', 'websiteUrl', e.target.value)} 
              />
              <div className="pt-4">
                <Button onClick={() => handleSave('general')} className="bg-indigo-600"><Save className="w-4 h-4 mr-2" /> Save General Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
           <Card className="bg-slate-900 border-white/10 mt-4">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Lock className="w-5 h-5" /> API Configuration</CardTitle>
              <CardDescription>Manage external API keys and limits.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input 
                label="OpenAI API Key" 
                type="password"
                value={settings.api.openaiKey} 
                onChange={(e) => handleUpdate('api', 'openaiKey', e.target.value)} 
              />
              <Input 
                label="Rate Limit (Requests per min/user)" 
                type="number"
                value={settings.api.rateLimitPerUser} 
                onChange={(e) => handleUpdate('api', 'rateLimitPerUser', parseInt(e.target.value))} 
              />
               <div className="pt-4">
                <Button onClick={() => handleSave('api')} className="bg-indigo-600"><Save className="w-4 h-4 mr-2" /> Save API Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
           <Card className="bg-slate-900 border-white/10 mt-4">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Mail className="w-5 h-5" /> Email Settings</CardTitle>
              <CardDescription>SMTP configuration for system emails.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <Input 
                  label="SMTP Host" 
                  value={settings.email.smtpHost} 
                  onChange={(e) => handleUpdate('email', 'smtpHost', e.target.value)} 
                />
                 <Input 
                  label="SMTP Port" 
                  value={settings.email.smtpPort} 
                  onChange={(e) => handleUpdate('email', 'smtpPort', e.target.value)} 
                />
              </div>
              <Input 
                label="SMTP Username" 
                value={settings.email.smtpUser} 
                onChange={(e) => handleUpdate('email', 'smtpUser', e.target.value)} 
              />
               <div className="pt-4">
                <Button onClick={() => handleSave('email')} className="bg-indigo-600"><Save className="w-4 h-4 mr-2" /> Save Email Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
           <Card className="bg-slate-900 border-white/10 mt-4">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Shield className="w-5 h-5" /> Security Policy</CardTitle>
              <CardDescription>Access control and session management.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <Input 
                  label="Minimum Password Length" 
                  type="number"
                  value={settings.security.minPasswordLength} 
                  onChange={(e) => handleUpdate('security', 'minPasswordLength', parseInt(e.target.value))} 
                />
                <Input 
                  label="Session Timeout (minutes)" 
                  type="number"
                  value={settings.security.sessionTimeout} 
                  onChange={(e) => handleUpdate('security', 'sessionTimeout', parseInt(e.target.value))} 
                />
               <div className="pt-4">
                <Button onClick={() => handleSave('security')} className="bg-indigo-600"><Save className="w-4 h-4 mr-2" /> Save Security Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default AdminSettingsPage;
