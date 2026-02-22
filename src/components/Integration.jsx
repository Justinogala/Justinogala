
import React from 'react';
import { 
  Slack, HardDrive, Box, Users, Zap, 
  CheckCircle2, XCircle, Settings, Power 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

// Icon mapping
const iconMap = {
  'Slack': Slack,
  'HardDrive': HardDrive,
  'Box': Box,
  'Users': Users,
  'Zap': Zap
};

const Integration = ({ integration, onConnect, onDisconnect, onConfigure, loading }) => {
  const Icon = iconMap[integration.icon] || Zap;
  const isConnected = integration.status === 'connected';
  const { toast } = useToast();

  const handleAction = async () => {
    if (isConnected) {
      if (confirm(`Disconnect ${integration.name}? This will revoke access.`)) {
        await onDisconnect(integration.id);
        toast({ title: "Disconnected", description: `${integration.name} has been disconnected.` });
      }
    } else {
      await onConnect(integration.id);
      toast({ title: "Connected", description: `${integration.name} successfully connected.` });
    }
  };

  return (
    <Card className="flex flex-col h-full border-l-4 border-l-transparent hover:border-l-primary transition-all duration-300">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="p-2 bg-muted rounded-lg">
           <Icon className="w-6 h-6 text-foreground" />
        </div>
        <Badge variant={isConnected ? "default" : "secondary"} className={cn(isConnected ? "bg-green-600 hover:bg-green-700" : "")}>
           {isConnected ? 'Active' : 'Inactive'}
        </Badge>
      </CardHeader>
      
      <CardContent className="flex-1 pt-4">
        <h3 className="font-semibold text-lg mb-1">{integration.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
          {integration.description}
        </p>
        
        {isConnected && integration.lastSync && (
          <p className="text-xs text-muted-foreground mt-4 flex items-center">
            <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
            Last synced: {new Date(integration.lastSync).toLocaleDateString()}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-2 gap-2">
        <Button 
           variant={isConnected ? "outline" : "default"} 
           className={cn("flex-1", isConnected && "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20")}
           onClick={handleAction}
           disabled={loading}
        >
          {loading ? (
             "Processing..." 
          ) : isConnected ? (
             <>
               <Power className="w-4 h-4 mr-2" /> Disconnect
             </>
          ) : (
             "Connect"
          )}
        </Button>
        
        {isConnected && (
          <Button variant="ghost" size="icon" onClick={() => onConfigure(integration.id)} title="Settings">
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default Integration;
