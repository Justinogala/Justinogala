import React, { useState } from 'react';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Save, RefreshCw, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import SettingsStatusBadge from '@/components/admin/SettingsStatusBadge';
import { toast } from '@/components/ui/use-toast';

const AdminIntegrationsPage = () => {
  const { 
    integrationConfig, updateIntegrationConfig, testIntegration, 
    integrationLogs, integrationStats, loading 
  } = useAdminSettings();
  
  const [testing, setTesting] = useState({});
  const [localConfig, setLocalConfig] = useState(null);
  const [saving, setSaving] = useState({});

  React.useEffect(() => {
    if (integrationConfig) setLocalConfig(integrationConfig);
  }, [integrationConfig]);

  if (loading || !localConfig) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

  const handleToggle = (key) => {
    const updated = { ...localConfig };
    updated[key].enabled = !updated[key].enabled;
    setLocalConfig(updated);
  };

  const handleSave = async (key) => {
    setSaving(prev => ({ ...prev, [key]: true }));
    // Saving entire config for now, in real app might save just one key
    updateIntegrationConfig(localConfig); 
    setTimeout(() => {
       setSaving(prev => ({ ...prev, [key]: false }));
       toast({ title: "Integration Saved", description: `${key} configuration is active.` });
    }, 500);
  };

  const handleTest = async (key) => {
    setTesting(prev => ({ ...prev, [key]: true }));
    await testIntegration(key);
    setTesting(prev => ({ ...prev, [key]: false }));
  };

  const handleDisconnect = (key) => {
    if (confirm(`Disconnect ${key}? This will remove stored credentials.`)) {
      const updated = { ...localConfig };
      updated[key] = { ...updated[key], enabled: false, status: 'disconnected', credentials: {} };
      setLocalConfig(updated);
      updateIntegrationConfig(updated);
      toast({ title: "Disconnected", description: `${key} integration has been removed.` });
    }
  };

  const integrationsList = [
    { id: 'slack', name: 'Slack', description: 'Send notifications and summaries to Slack channels.' },
    { id: 'googleDrive', name: 'Google Drive', description: 'Auto-export transcriptions to Drive folders.' },
    { id: 'dropbox', name: 'Dropbox', description: 'Sync meeting recordings and files.' },
    { id: 'teams', name: 'Microsoft Teams', description: 'Import meetings and export summaries.' },
    { id: 'zapier', name: 'Zapier', description: 'Connect with 5000+ other apps via webhooks.' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground mt-1">Manage third-party connections and data flows.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {integrationsList.map((integration) => {
            const config = localConfig[integration.id];
            return (
              <Card key={integration.id} className="overflow-hidden">
                <div className="p-6 flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold
                      ${config.enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                      {integration.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {integration.name}
                        {config.status === 'connected' && <Badge className="bg-green-500 hover:bg-green-600 h-5 text-[10px]">Connected</Badge>}
                      </h3>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                         <SettingsStatusBadge 
                           status={config.status === 'connected' ? 'active' : 'inactive'} 
                           timestamp={config.lastUsed}
                           label={config.status}
                         />
                      </div>
                    </div>
                  </div>
                  <Switch 
                    checked={config.enabled}
                    onCheckedChange={() => handleToggle(integration.id)}
                  />
                </div>
                
                {config.enabled && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 border-t p-4">
                    <Accordion type="single" collapsible>
                      <AccordionItem value="settings" className="border-none">
                        <AccordionTrigger className="py-2 text-sm font-medium">Configure Settings</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase text-muted-foreground">Client ID / Key</label>
                                <Input type="password" placeholder="Enter API Key or Client ID" />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase text-muted-foreground">Client Secret</label>
                                <Input type="password" placeholder="Enter Client Secret" />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-xs font-semibold uppercase text-muted-foreground">Permissions</label>
                              <div className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                  <Checkbox id={`read-${integration.id}`} defaultChecked />
                                  <label htmlFor={`read-${integration.id}`} className="text-sm">Read Data</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox id={`write-${integration.id}`} />
                                  <label htmlFor={`write-${integration.id}`} className="text-sm">Write/Export</label>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-between pt-2 border-t mt-4">
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDisconnect(integration.id)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Disconnect
                              </Button>
                              
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleTest(integration.id)} disabled={testing[integration.id]}>
                                  {testing[integration.id] ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                  Test
                                </Button>
                                <Button size="sm" onClick={() => handleSave(integration.id)} disabled={saving[integration.id]}>
                                  {saving[integration.id] ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                  Save Configuration
                                </Button>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrationsList.map(int => (
                   <div key={int.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                     <span className="text-sm font-medium">{int.name}</span>
                     <div className="text-right">
                       <div className="font-bold">{integrationStats[int.id]?.exports || 0}</div>
                       <div className="text-xs text-muted-foreground">{integrationStats[int.id]?.successRate}% Success</div>
                     </div>
                   </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integration Logs</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="max-h-[400px] overflow-y-auto space-y-3">
                 {integrationLogs.length === 0 ? (
                   <p className="text-sm text-muted-foreground text-center">No recent activity.</p>
                 ) : (
                   integrationLogs.map(log => (
                     <div key={log.id} className="text-sm flex gap-3 items-start">
                        {log.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p className="font-medium capitalize">{log.type}</p>
                          <p className="text-muted-foreground">{log.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                        </div>
                     </div>
                   ))
                 )}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminIntegrationsPage;