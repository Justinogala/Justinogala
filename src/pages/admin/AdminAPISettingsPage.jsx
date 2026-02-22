import React, { useState } from 'react';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import SettingsStatusBadge from '@/components/admin/SettingsStatusBadge';

const AdminAPISettingsPage = () => {
  const { 
    apiConfig, updateApiConfig, testApiConnection, 
    apiLogs, loading, settingsStatus 
  } = useAdminSettings();
  
  const [testing, setTesting] = useState({ openai: false, googleCloud: false });
  const [localConfig, setLocalConfig] = useState(null);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (apiConfig) setLocalConfig(apiConfig);
  }, [apiConfig]);

  if (loading || !localConfig) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

  const handleSave = async () => {
    setSaving(true);
    await updateApiConfig(localConfig);
    setTimeout(() => setSaving(false), 500);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all API settings to defaults? This cannot be undone.')) {
       // Reset logic effectively just re-initializes or clears
       // For now we reload to get defaults from service if we clear localStorage manually
       // But better to have a reset method in context. For now, manual update:
       const resetConfig = {
         ...localConfig,
         openai: { ...localConfig.openai, key: '', status: 'inactive', health: 'neutral' },
         googleCloud: { ...localConfig.googleCloud, key: '', status: 'inactive', health: 'neutral' }
       };
       updateApiConfig(resetConfig);
       toast({ title: "Settings Reset", description: "API configurations have been reset to defaults." });
    }
  };

  const handleTest = async (provider) => {
    setTesting(prev => ({ ...prev, [provider]: true }));
    const result = await testApiConnection(provider, localConfig[provider].key);
    setTesting(prev => ({ ...prev, [provider]: false }));
    
    if (result.success) {
      toast({ title: "Connection Successful", description: `${provider} is active and responding.` });
    } else {
      toast({ variant: "destructive", title: "Connection Failed", description: result.error || "Unknown error occurred" });
    }
  };

  const getHealthBadge = (health) => {
    const colors = {
      good: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      critical: 'bg-red-100 text-red-800 border-red-200',
      neutral: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return <Badge variant="outline" className={colors[health] || colors.neutral}>{health?.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Settings</h1>
          <p className="text-muted-foreground mt-1">Configure and monitor external AI service connections.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" /> Reset
          </Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration Area */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="openai">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="openai">OpenAI</TabsTrigger>
              <TabsTrigger value="google">Google Cloud</TabsTrigger>
            </TabsList>
            
            {/* OpenAI Tab */}
            <TabsContent value="openai">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>OpenAI Configuration</span>
                    <div className="flex gap-2 items-center">
                      <SettingsStatusBadge 
                        status={localConfig.openai.status} 
                        timestamp={localConfig.openai.lastTested}
                        label={localConfig.openai.status === 'active' ? 'Active' : 'Inactive'}
                      />
                      {getHealthBadge(localConfig.openai.health)}
                    </div>
                  </CardTitle>
                  <CardDescription>Configure access to GPT-4 and Whisper models.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">API Key</label>
                    <div className="flex gap-2">
                      <Input 
                        type="password" 
                        value={localConfig.openai.key}
                        onChange={(e) => setLocalConfig({...localConfig, openai: {...localConfig.openai, key: e.target.value}})}
                        placeholder="sk-..." 
                      />
                      <Button variant="outline" onClick={() => handleTest('openai')} disabled={testing.openai}>
                        {testing.openai ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Key is stored securely in local storage for this demo.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                      <div className="text-sm text-muted-foreground">Calls This Month</div>
                      <div className="text-2xl font-bold">{localConfig.usage.openai.calls}</div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                      <div className="text-sm text-muted-foreground">Est. Cost</div>
                      <div className="text-2xl font-bold">${localConfig.usage.openai.cost.toFixed(2)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Google Cloud Tab */}
            <TabsContent value="google">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Google Cloud Configuration</span>
                    <div className="flex gap-2 items-center">
                      <SettingsStatusBadge 
                          status={localConfig.googleCloud.status} 
                          timestamp={localConfig.googleCloud.lastTested}
                          label={localConfig.googleCloud.status === 'active' ? 'Active' : 'Inactive'}
                        />
                      {getHealthBadge(localConfig.googleCloud.health)}
                    </div>
                  </CardTitle>
                  <CardDescription>Configure Speech-to-Text and NLP services.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Service Account Key (JSON)</label>
                    <div className="flex gap-2">
                      <Input 
                        type="password" 
                        value={localConfig.googleCloud.key}
                        onChange={(e) => setLocalConfig({...localConfig, googleCloud: {...localConfig.googleCloud, key: e.target.value}})}
                        placeholder='{"type": "service_account"...}' 
                      />
                      <Button variant="outline" onClick={() => handleTest('googleCloud')} disabled={testing.googleCloud}>
                        {testing.googleCloud ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                      <div className="text-sm text-muted-foreground">Quota Used</div>
                      <div className="text-2xl font-bold">{((localConfig.usage.googleCloud.calls / localConfig.usage.googleCloud.quota) * 100).toFixed(1)}%</div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                      <div className="text-sm text-muted-foreground">Est. Cost</div>
                      <div className="text-2xl font-bold">${localConfig.usage.googleCloud.cost.toFixed(2)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Default Providers */}
          <Card>
            <CardHeader>
              <CardTitle>Default Service Providers</CardTitle>
              <CardDescription>Choose which API handles specific tasks by default.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Transcription Service</label>
                  <Select 
                    value={localConfig.defaults.transcription} 
                    onValueChange={(val) => setLocalConfig({...localConfig, defaults: {...localConfig.defaults, transcription: val}})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI Whisper</SelectItem>
                      <SelectItem value="google">Google Cloud STT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Summarization Service</label>
                  <Select 
                    value={localConfig.defaults.summarization}
                    onValueChange={(val) => setLocalConfig({...localConfig, defaults: {...localConfig.defaults, summarization: val}})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                      <SelectItem value="google">Google Gemini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Status & Logs */}
        <div className="space-y-6">
          <Card className="bg-slate-900 text-white border-none">
            <CardHeader>
              <CardTitle className="text-lg">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${localConfig.openai.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span>OpenAI</span>
                </div>
                <span className="text-xs text-slate-400">{localConfig.openai.lastTested ? new Date(localConfig.openai.lastTested).toLocaleDateString() : 'Never'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${localConfig.googleCloud.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span>Google Cloud</span>
                </div>
                <span className="text-xs text-slate-400">{localConfig.googleCloud.lastTested ? new Date(localConfig.googleCloud.lastTested).toLocaleDateString() : 'Never'}</span>
              </div>
              
              <div className="pt-2">
                <p className="text-xs text-slate-500 mb-1">Global Configuration:</p>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Last Saved:</span>
                  <span>{settingsStatus?.api?.timestamp ? new Date(settingsStatus.api.timestamp).toLocaleTimeString() : 'Unknown'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Error Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {apiLogs.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">No recent errors</div>
              ) : (
                <div className="space-y-3">
                  {apiLogs.slice(0, 5).map(log => (
                    <div key={log.id} className="text-sm border-l-2 border-red-400 pl-3 py-1">
                      <p className="font-medium text-red-600 truncate">{log.message}</p>
                      <p className="text-xs text-muted-foreground flex justify-between">
                        <span>{log.provider}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminAPISettingsPage;