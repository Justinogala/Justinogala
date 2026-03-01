import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  Cloud, Server, Database, HardDrive, RefreshCw, CheckCircle, 
  XCircle, AlertTriangle, Upload, Settings, ArrowRight, Loader2
} from 'lucide-react';

const API_URL = import.meta.env.REACT_APP_BACKEND_URL || '';

const PROVIDER_ICONS = {
  gridfs: Database,
  aws_s3: Cloud,
  google_cloud: Cloud,
  cloudflare_r2: Cloud,
  backblaze_b2: HardDrive
};

const AdminCloudStoragePage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [migrating, setMigrating] = useState(false);
  
  const [providers, setProviders] = useState({});
  const [currentProvider, setCurrentProvider] = useState('gridfs');
  const [selectedProvider, setSelectedProvider] = useState('gridfs');
  const [config, setConfig] = useState({});
  const [formConfig, setFormConfig] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [storageStats, setStorageStats] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load providers
      const providersRes = await fetch(`${API_URL}/api/admin/storage/providers`);
      const providersData = await providersRes.json();
      setProviders(providersData.providers || {});

      // Load current config
      const configRes = await fetch(`${API_URL}/api/admin/storage/config`);
      const configData = await configRes.json();
      setCurrentProvider(configData.current_provider || 'gridfs');
      setSelectedProvider(configData.current_provider || 'gridfs');
      setConfig(configData.config || {});
      setFormConfig(configData.config || {});

      // Load migration status
      const migrationRes = await fetch(`${API_URL}/api/admin/storage/migration/status`);
      const migrationData = await migrationRes.json();
      setMigrationStatus(migrationData.migration);
      setStorageStats(migrationData.storage_stats);
    } catch (error) {
      console.error('Error loading storage config:', error);
      toast({ variant: 'destructive', title: 'Failed to load storage configuration' });
    }
    setLoading(false);
  };

  const handleProviderChange = (provider) => {
    setSelectedProvider(provider);
    setFormConfig({});
    setTestResult(null);
  };

  const handleConfigChange = (key, value) => {
    setFormConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/storage/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selectedProvider, config: formConfig })
      });
      const data = await res.json();
      setTestResult(data);
      
      if (data.success) {
        toast({ title: 'Connection successful', description: data.message });
      } else {
        toast({ variant: 'destructive', title: 'Connection failed', description: data.message });
      }
    } catch (error) {
      setTestResult({ success: false, message: error.message });
      toast({ variant: 'destructive', title: 'Connection test failed' });
    }
    setTesting(false);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/storage/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selectedProvider, config: formConfig })
      });
      const data = await res.json();
      
      if (data.success) {
        setCurrentProvider(selectedProvider);
        setConfig(formConfig);
        toast({ title: 'Configuration saved', description: `Storage set to ${providers[selectedProvider]?.name}` });
      } else {
        toast({ variant: 'destructive', title: 'Save failed', description: data.detail || data.message });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to save configuration' });
    }
    setSaving(false);
  };

  const handleStartMigration = async () => {
    if (!confirm('Are you sure you want to start the migration? This will copy all files to the new storage provider.')) {
      return;
    }
    
    setMigrating(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/storage/migration/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_provider: currentProvider })
      });
      const data = await res.json();
      
      if (data.success) {
        setMigrationStatus(data.status);
        toast({ title: 'Migration started', description: `Migrating ${data.status.total_files} files` });
      } else {
        toast({ variant: 'destructive', title: 'Migration failed', description: data.detail || data.message });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to start migration' });
    }
    setMigrating(false);
  };

  const renderProviderFields = () => {
    const provider = providers[selectedProvider];
    if (!provider || !provider.fields || provider.fields.length === 0) {
      return (
        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            GridFS uses MongoDB for storage. No additional configuration needed.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        {provider.fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.type === 'textarea' ? (
              <textarea
                id={field.key}
                className="w-full min-h-[100px] p-3 rounded-md border border-slate-700 bg-slate-800 text-white"
                placeholder={field.label}
                value={formConfig[field.key] || ''}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
              />
            ) : (
              <Input
                id={field.key}
                type={field.type === 'password' ? 'password' : 'text'}
                placeholder={field.default || field.label}
                value={formConfig[field.key] || ''}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-cloud-storage-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cloud Storage</h1>
          <p className="text-slate-400">Configure cloud storage providers for file storage and migration</p>
        </div>
        <Button variant="outline" onClick={loadData} data-testid="refresh-storage-btn">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Server className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Current Provider</p>
                <p className="text-lg font-semibold text-white">
                  {providers[currentProvider]?.name || 'GridFS'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Files in GridFS</p>
                <p className="text-lg font-semibold text-white">
                  {(storageStats?.recordings_in_gridfs || 0) + (storageStats?.chat_files_in_gridfs || 0)} files
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <HardDrive className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Files</p>
                <p className="text-lg font-semibold text-white">
                  {(storageStats?.total_recordings || 0) + (storageStats?.total_chat_files || 0)} files
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="configure" className="space-y-4">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="configure" className="data-[state=active]:bg-purple-600">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </TabsTrigger>
          <TabsTrigger value="migrate" className="data-[state=active]:bg-purple-600">
            <ArrowRight className="w-4 h-4 mr-2" />
            Migrate
          </TabsTrigger>
        </TabsList>

        {/* Configure Tab */}
        <TabsContent value="configure">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Storage Provider Configuration</CardTitle>
              <CardDescription>Select and configure your cloud storage provider</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Provider Selection */}
              <div className="space-y-2">
                <Label>Select Provider</Label>
                <Select value={selectedProvider} onValueChange={handleProviderChange}>
                  <SelectTrigger className="bg-slate-800 border-slate-700" data-testid="provider-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {Object.entries(providers).map(([key, provider]) => {
                      const Icon = PROVIDER_ICONS[key] || Cloud;
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span>{provider.name}</span>
                            {key === currentProvider && (
                              <Badge variant="secondary" className="ml-2 text-xs">Current</Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-400">
                  {providers[selectedProvider]?.description}
                </p>
              </div>

              {/* Provider-specific Fields */}
              {renderProviderFields()}

              {/* Test Result */}
              {testResult && (
                <Alert variant={testResult.success ? 'default' : 'destructive'}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{testResult.message}</AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                {selectedProvider !== 'gridfs' && (
                  <Button 
                    variant="outline" 
                    onClick={handleTestConnection}
                    disabled={testing}
                    data-testid="test-connection-btn"
                  >
                    {testing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Test Connection
                  </Button>
                )}
                <Button 
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700"
                  data-testid="save-config-btn"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Migrate Tab */}
        <TabsContent value="migrate">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Storage Migration</CardTitle>
              <CardDescription>
                Migrate files from GridFS to your configured cloud storage provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Migration Status */}
              {migrationStatus && migrationStatus.status !== 'not_started' && (
                <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Migration Status</span>
                    <Badge 
                      variant={migrationStatus.status === 'completed' ? 'default' : 'secondary'}
                      className={
                        migrationStatus.status === 'completed' ? 'bg-green-600' : 
                        migrationStatus.status === 'in_progress' ? 'bg-blue-600 animate-pulse' :
                        migrationStatus.status === 'completed_with_errors' ? 'bg-yellow-600' :
                        migrationStatus.status === 'failed' ? 'bg-red-600' : ''
                      }
                    >
                      {migrationStatus.status === 'in_progress' ? 'In Progress...' : migrationStatus.status}
                    </Badge>
                  </div>
                  
                  <Progress 
                    value={migrationStatus.total_files > 0 ? (migrationStatus.migrated_files / migrationStatus.total_files) * 100 : 0} 
                    className="h-2"
                  />
                  
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>{migrationStatus.migrated_files} migrated</span>
                    <span>{migrationStatus.failed_files} failed</span>
                    <span>{migrationStatus.total_files} total</span>
                  </div>
                  
                  {/* Current file being processed */}
                  {migrationStatus.status === 'in_progress' && migrationStatus.current_file && (
                    <div className="text-xs text-slate-500 truncate">
                      <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
                      {migrationStatus.current_file}
                    </div>
                  )}
                  
                  {/* Timestamps */}
                  <div className="text-xs text-slate-500 space-y-1">
                    {migrationStatus.started_at && (
                      <p>Started: {new Date(migrationStatus.started_at).toLocaleString()}</p>
                    )}
                    {migrationStatus.completed_at && (
                      <p>Completed: {new Date(migrationStatus.completed_at).toLocaleString()}</p>
                    )}
                  </div>
                  
                  {migrationStatus.failed_files > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {migrationStatus.failed_files} files failed to migrate
                        {migrationStatus.errors && migrationStatus.errors.length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs">View errors ({migrationStatus.errors.length})</summary>
                            <ul className="mt-2 text-xs space-y-1 max-h-32 overflow-y-auto">
                              {migrationStatus.errors.slice(0, 10).map((err, i) => (
                                <li key={i} className="text-red-300">{err}</li>
                              ))}
                              {migrationStatus.errors.length > 10 && (
                                <li className="text-slate-400">...and {migrationStatus.errors.length - 10} more</li>
                              )}
                            </ul>
                          </details>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {migrationStatus.status === 'completed' && (
                    <Alert className="bg-green-900/30 border-green-700">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <AlertDescription className="text-green-300">
                        Migration completed successfully! All {migrationStatus.migrated_files} files have been moved to {migrationStatus.target_provider}.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Migration Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg">
                  <Database className="w-8 h-8 text-blue-400" />
                  <ArrowRight className="w-6 h-6 text-slate-500" />
                  {React.createElement(PROVIDER_ICONS[currentProvider] || Cloud, {
                    className: "w-8 h-8 text-purple-400"
                  })}
                  <div className="ml-4">
                    <p className="text-white font-medium">
                      GridFS → {providers[currentProvider]?.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {(storageStats?.recordings_in_gridfs || 0) + (storageStats?.chat_files_in_gridfs || 0)} files to migrate
                    </p>
                  </div>
                </div>

                {currentProvider === 'gridfs' ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Configure a cloud storage provider first before starting migration.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <Upload className="h-4 w-4" />
                    <AlertDescription>
                      Migration will copy all files from GridFS to {providers[currentProvider]?.name}. 
                      Original files in GridFS will be preserved until you manually delete them.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleStartMigration}
                  disabled={migrating || currentProvider === 'gridfs' || migrationStatus?.status === 'in_progress'}
                  className="bg-purple-600 hover:bg-purple-700"
                  data-testid="start-migration-btn"
                >
                  {migrating || migrationStatus?.status === 'in_progress' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {migrationStatus?.status === 'in_progress' ? 'Migration in Progress...' : 'Start Migration'}
                </Button>
                
                {migrationStatus?.status === 'in_progress' && (
                  <Button variant="outline" onClick={loadData}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Status
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCloudStoragePage;
