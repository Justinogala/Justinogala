
import React, { useState, useEffect } from 'react';
import { integrationService } from '@/services/integrationService';
import { slackIntegrationService } from '@/services/slackIntegrationService';
import { googleDriveIntegrationService } from '@/services/googleDriveIntegrationService';
import { dropboxIntegrationService } from '@/services/dropboxIntegrationService';
import { microsoftTeamsIntegrationService } from '@/services/microsoftTeamsIntegrationService';
import { zapierIntegrationService } from '@/services/zapierIntegrationService';
import Integration from './Integration';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const IntegrationList = () => {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = () => {
    setLoading(true);
    // Simulate slight delay for fetching config
    setTimeout(() => {
      setIntegrations(integrationService.getAllIntegrations());
      setLoading(false);
    }, 500);
  };

  const handleConnect = async (id) => {
    setActionLoading(id);
    try {
      let result;
      switch (id) {
        case 'slack':
          result = await slackIntegrationService.connect();
          break;
        case 'google_drive':
          result = await googleDriveIntegrationService.connect();
          break;
        case 'dropbox':
          result = await dropboxIntegrationService.connect();
          break;
        case 'msteams':
          result = await microsoftTeamsIntegrationService.connect();
          break;
        case 'zapier':
          result = await zapierIntegrationService.connect();
          break;
        default:
          throw new Error("Unknown integration");
      }
      
      if (result.success) {
        loadIntegrations();
      }
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Connection Failed", 
        description: error.message 
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnect = async (id) => {
    setActionLoading(id);
    try {
      // Simulate API delay
      await new Promise(r => setTimeout(r, 800));
      integrationService.disconnectIntegration(id);
      loadIntegrations();
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Disconnect Failed", 
        description: error.message 
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfigure = (id) => {
    toast({ 
      title: "Settings", 
      description: "Advanced configuration modal would open here." 
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {integrations.map((integration) => (
        <Integration
          key={integration.id}
          integration={integration}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onConfigure={handleConfigure}
          loading={actionLoading === integration.id}
        />
      ))}
    </div>
  );
};

export default IntegrationList;
