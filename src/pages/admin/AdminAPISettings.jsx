
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminSettings } from '@/context/AdminSettingsContext';
import { useToast } from '@/components/ui/use-toast';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import { Key, ShieldAlert, CheckCircle, Trash2 } from 'lucide-react';

const AdminAPISettings = () => {
  const { 
    setOpenAIKey, 
    setGoogleKey, 
    validateApiKey, 
    isApiConfigured, 
    clearApiKeys,
    setDefaultApiProvider,
    getDefaultApiProvider 
  } = useAdminSettings();
  
  const [keys, setKeys] = useState({ openai: '', google: '' });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async (provider) => {
    setLoading(true);
    const key = keys[provider];
    
    if (!key) {
      toast({ title: "Error", description: "Key cannot be empty", variant: "destructive" });
      setLoading(false);
      return;
    }

    const validation = await validateApiKey(key, provider);
    if (!validation.valid) {
      toast({ title: "Invalid Key", description: validation.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (provider === 'openai') setOpenAIKey(key);
    if (provider === 'google') setGoogleKey(key);

    toast({ title: "Saved", description: `${provider} API key configured successfully.` });
    setKeys(prev => ({ ...prev, [provider]: '' }));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      <AdminSidebar className="w-64 hidden lg:flex" />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="p-6 space-y-6">
          <Helmet><title>API Settings | Admin</title></Helmet>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">API Configuration</h1>
              <p className="text-slate-500">Manage global AI service connections for all users.</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => {
              if(confirm("Remove ALL API keys? Users will lose AI functionality.")) clearApiKeys();
            }}>
              <Trash2 className="w-4 h-4 mr-2" /> Clear All Keys
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* OpenAI Config */}
            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle className="flex items-center gap-2"><Key className="w-5 h-5" /> OpenAI</CardTitle>
                  {isApiConfigured('openai') && <CheckCircle className="text-green-500 w-5 h-5" />}
                </div>
                <CardDescription>Configure Whisper and GPT models.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="password" 
                      placeholder="sk-..." 
                      value={keys.openai}
                      onChange={e => setKeys({...keys, openai: e.target.value})}
                    />
                    <Button onClick={() => handleSave('openai')} disabled={loading}>Save</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Google Config */}
            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle className="flex items-center gap-2"><Key className="w-5 h-5" /> Google Cloud</CardTitle>
                  {isApiConfigured('google') && <CheckCircle className="text-green-500 w-5 h-5" />}
                </div>
                <CardDescription>Configure Speech-to-Text API.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="password" 
                      placeholder="AIza..." 
                      value={keys.google}
                      onChange={e => setKeys({...keys, google: e.target.value})}
                    />
                    <Button onClick={() => handleSave('google')} disabled={loading}>Save</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Defaults Config */}
          <Card>
            <CardHeader><CardTitle>Service Defaults</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Transcription Provider</Label>
                  <Select 
                    defaultValue={getDefaultApiProvider('transcription')} 
                    onValueChange={(val) => setDefaultApiProvider('transcription', val)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI Whisper</SelectItem>
                      <SelectItem value="google">Google Cloud Speech</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Summarization Provider</Label>
                  <Select 
                    defaultValue={getDefaultApiProvider('summarization')}
                    onValueChange={(val) => setDefaultApiProvider('summarization', val)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex gap-3 text-sm text-yellow-800">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p>
              <strong>Security Warning:</strong> API keys are encrypted before storage, but providing them here gives all users of this instance access to the configured AI services. Monitor your usage limits in the provider dashboards.
            </p>
          </div>

        </main>
      </div>
    </div>
  );
};

export default AdminAPISettings;
