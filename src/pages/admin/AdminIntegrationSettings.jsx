
import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAdminSettings } from '@/context/AdminSettingsContext';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import { Zap, Slack, HardDrive, Box, Users } from 'lucide-react';

const AdminIntegrationSettings = () => {
  const { getAllIntegrations, toggleIntegration } = useAdminSettings();
  const integrations = getAllIntegrations();

  // Helper to map icons
  const getIcon = (name) => {
    if (name.includes('Slack')) return <Slack className="w-6 h-6" />;
    if (name.includes('Drive')) return <HardDrive className="w-6 h-6" />;
    if (name.includes('Dropbox')) return <Box className="w-6 h-6" />;
    if (name.includes('Teams')) return <Users className="w-6 h-6" />;
    return <Zap className="w-6 h-6" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      <AdminSidebar className="w-64 hidden lg:flex" />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="p-6 space-y-6">
          <Helmet><title>Integration Settings | Admin</title></Helmet>
          
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Integration Management</h1>
            <p className="text-slate-500">Enable or disable third-party integrations for your workspace.</p>
          </div>

          <div className="grid gap-6">
            {integrations.map((integration) => (
              <Card key={integration.id} className="flex flex-row items-center p-6">
                <div className="p-3 bg-slate-100 rounded-lg mr-4 text-slate-700">
                  {getIcon(integration.name)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{integration.name}</h3>
                  <p className="text-sm text-slate-500">{integration.description || `Enable ${integration.name} integration for all users.`}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Label htmlFor={`switch-${integration.id}`} className="text-sm font-medium">
                    {integration.isEnabled ? 'Enabled' : 'Disabled'}
                  </Label>
                  <Switch 
                    id={`switch-${integration.id}`}
                    checked={integration.isEnabled}
                    onCheckedChange={(val) => toggleIntegration(integration.id, val)}
                  />
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminIntegrationSettings;
