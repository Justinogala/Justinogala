import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Trash2, Eye, EyeOff, Video, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

import { getApiUrl, API_URL } from '@/lib/api';

const AdminVideoSettingsPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  
  const [config, setConfig] = useState({
    configured: false,
    provider: 'openai',
    key_preview: null,
    api_key: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/video-api-settings`);
      if (res.ok) {
        const data = await res.json();
        setConfig({
          ...data,
          api_key: '' // Don't populate the actual key
        });
      }
    } catch (error) {
      console.error('Error loading video API settings:', error);
      toast({ variant: 'destructive', title: 'Failed to load settings' });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!config.api_key.trim()) {
      toast({ variant: 'destructive', title: 'Please enter an API key' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/video-api-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: config.api_key,
          provider: config.provider
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast({ title: 'Settings saved', description: 'Video API key has been updated.' });
        setConfig(prev => ({
          ...prev,
          configured: true,
          key_preview: data.key_preview,
          api_key: ''
        }));
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to save settings' });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to remove the API key? Video generation will stop working.')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/video-api-settings`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast({ title: 'API key removed' });
        setConfig({
          configured: false,
          provider: 'openai',
          key_preview: null,
          api_key: ''
        });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to remove API key' });
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/video-api-settings/test`, {
        method: 'POST'
      });
      const data = await res.json();

      if (data.success) {
        toast({ title: 'Connection successful', description: 'API key is valid and configured.' });
      } else {
        toast({ variant: 'destructive', title: 'Test failed', description: data.error });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Test failed' });
    }
    setTesting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Video Generation Settings</h1>
        <p className="text-muted-foreground mt-1">Configure API key for Sora 2 text-to-video generation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-fuchsia-500" />
                OpenAI Sora 2 API Key
              </CardTitle>
              <CardDescription>
                Enter your OpenAI API key with Sora 2 access. This key will be used for all video generation requests.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Status */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                {config.configured ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">API Key Configured</p>
                      <p className="text-xs text-gray-500">Current key: {config.key_preview}</p>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-700 dark:text-red-400">Not Configured</p>
                      <p className="text-xs text-gray-500">Video generation is disabled</p>
                    </div>
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Inactive</Badge>
                  </>
                )}
              </div>

              {/* API Key Input */}
              <div className="space-y-2">
                <Label htmlFor="api-key">{config.configured ? 'Update API Key' : 'Enter API Key'}</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="api-key"
                      type={showKey ? 'text' : 'password'}
                      placeholder="sk-..."
                      value={config.api_key}
                      onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button onClick={handleSave} disabled={saving || !config.api_key.trim()}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your OpenAI API key must have access to Sora 2 video generation.
                </p>
              </div>

              {/* Actions */}
              {config.configured && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={handleTest} disabled={testing}>
                    {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Test Connection
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Key
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">How to get an API Key</p>
                  <ol className="text-amber-700 dark:text-amber-400 space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com</a></li>
                    <li>Navigate to API Keys section</li>
                    <li>Create a new API key with Sora 2 access</li>
                    <li>Copy and paste the key above</li>
                  </ol>
                  <p className="mt-2 text-xs">Note: Sora 2 requires OpenAI Plus or Pro subscription for API access.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-slate-900 text-white border-none">
            <CardHeader>
              <CardTitle className="text-lg">Service Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${config.configured ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span>Sora 2 API</span>
                </div>
                <span className="text-xs text-slate-400">
                  {config.configured ? 'Connected' : 'Not configured'}
                </span>
              </div>
              
              <div className="pt-2 text-xs text-slate-500">
                <p>Provider: OpenAI</p>
                <p>Models: sora-2, sora-2-pro</p>
                <p>Max Duration: 60 seconds</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supported Features</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Text-to-Video</span>
                <Badge variant="outline" className={config.configured ? 'bg-green-100 text-green-700' : 'bg-gray-100'}>
                  {config.configured ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>HD Video (720p)</span>
                <Badge variant="outline" className={config.configured ? 'bg-green-100 text-green-700' : 'bg-gray-100'}>
                  {config.configured ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Extended Duration</span>
                <Badge variant="outline" className={config.configured ? 'bg-green-100 text-green-700' : 'bg-gray-100'}>
                  {config.configured ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminVideoSettingsPage;
