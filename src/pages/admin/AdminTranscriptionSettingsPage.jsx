
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Save, RefreshCw, CheckCircle, AlertCircle, Eye, EyeOff, Settings, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { transcriptionConfigService } from '@/services/transcriptionConfigService';

const AdminTranscriptionSettingsPage = () => {
  const { toast } = useToast();
  const [configs, setConfigs] = useState({});
  const [showKeys, setShowKeys] = useState({});
  const [testing, setTesting] = useState({});

  useEffect(() => {
    setConfigs(transcriptionConfigService.getAllConfigs());
  }, []);

  const handleApiKeyChange = (providerId, value) => {
    setConfigs(prev => ({
      ...prev,
      [providerId]: { ...prev[providerId], apiKey: value } 
    }));
  };

  const handleOptionChange = (providerId, option, value) => {
    setConfigs(prev => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        options: {
          ...prev[providerId].options,
          [option]: value
        }
      }
    }));
  };

  const handleSave = (providerId) => {
    let success = transcriptionConfigService.saveAPIKey(providerId, configs[providerId].apiKey);
    
    if (configs[providerId].options) {
      transcriptionConfigService.saveProviderSettings(providerId, {
        options: configs[providerId].options
      });
      success = true;
    }

    if (success) {
      toast({ title: "Saved", description: `${configs[providerId].name} configuration saved.` });
      setConfigs(transcriptionConfigService.getAllConfigs());
    }
  };

  const handleToggle = (providerId, enabled) => {
    transcriptionConfigService.toggleProvider(providerId, enabled);
    setConfigs(prev => ({
      ...prev,
      [providerId]: { ...prev[providerId], enabled }
    }));
  };

  const handleTestConnection = async (providerId) => {
    setTesting(prev => ({ ...prev, [providerId]: true }));
    try {
      await transcriptionConfigService.testConnection(providerId);
      
      transcriptionConfigService.updateProviderStatus(providerId, 'active');
      
      toast({ 
        title: "Connection Successful", 
        description: `Successfully connected to Munal AI Provider (${configs[providerId].name})`,
        className: "bg-green-50 border-green-200 text-green-800"
      });
      
      setConfigs(transcriptionConfigService.getAllConfigs());
    } catch (error) {
      toast({ 
        title: "Connection Failed", 
        description: error.message,
        variant: "destructive"
      });
      transcriptionConfigService.updateProviderStatus(providerId, 'error');
      setConfigs(transcriptionConfigService.getAllConfigs());
    } finally {
      setTesting(prev => ({ ...prev, [providerId]: false }));
    }
  };

  const toggleShowKey = (id) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!Object.keys(configs).length) {
    return <div className="p-8 text-center">Loading Munal AI settings...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <Helmet>
        <title>Transcription Settings | Munal AI Admin</title>
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Munal AI Powered Providers</h1>
        <p className="text-gray-500 mt-2">Manage API keys and settings for state-of-the-art Whisper processing services.</p>
      </div>

      <Tabs defaultValue="openai" className="space-y-6">
        <TabsList className="bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
          {Object.values(configs).map(provider => (
            <TabsTrigger 
              key={provider.id} 
              value={provider.id} 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
            >
              {provider.name}
              {provider.enabled && <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span>}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.values(configs).map(provider => (
          <TabsContent key={provider.id} value={provider.id}>
            <Card className="border-t-4 border-t-indigo-500 shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Zap className="w-5 h-5 text-indigo-500" />
                      Munal AI: {provider.name}
                    </CardTitle>
                    <CardDescription>Configure state-of-the-art Whisper model access and limits.</CardDescription>
                  </div>
                  <Badge variant={provider.status === 'active' ? 'success' : 'outline'} className={
                    provider.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 
                    provider.status === 'error' ? 'bg-red-100 text-red-700 border-red-200' : ''
                  }>
                    {provider.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Enable Munal AI Provider</Label>
                    <p className="text-sm text-gray-500">Allow users to process files using Munal AI state-of-the-art model.</p>
                  </div>
                  <Switch 
                    checked={provider.enabled}
                    onCheckedChange={(c) => handleToggle(provider.id, c)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Munal AI API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input 
                        type={showKeys[provider.id] ? "text" : "password"}
                        value={provider.apiKey}
                        onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                        placeholder="Munal Key..."
                        className="pr-10 font-mono text-gray-900 dark:text-white"
                      />
                      <button 
                        type="button"
                        onClick={() => toggleShowKey(provider.id)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showKeys[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {provider.id === 'openai' && (
                  <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Munal AI Configuration
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Whisper Model</Label>
                        <Select 
                          value={provider.options?.model || 'whisper-1'} 
                          onValueChange={(val) => handleOptionChange(provider.id, 'model', val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="whisper-1">whisper-1 (Munal AI Optimised)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Munal AI Language Support</Label>
                        <Select 
                          value={provider.options?.language || 'auto'}
                          onValueChange={(val) => handleOptionChange(provider.id, 'language', val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto-Detect</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between bg-gray-50/50 dark:bg-slate-900/50 p-6 border-t border-gray-100 dark:border-slate-800">
                <Button 
                  variant="outline" 
                  onClick={() => handleTestConnection(provider.id)}
                  disabled={testing[provider.id]}
                >
                  {testing[provider.id] ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Test Munal AI Connection
                </Button>
                <Button onClick={() => handleSave(provider.id)} className="bg-indigo-600 hover:bg-indigo-700">
                  <Save className="w-4 h-4 mr-2" /> Save Munal AI Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminTranscriptionSettingsPage;
