
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const SettingsStatusBadge = ({ status, timestamp, isLoading, label }) => {
  if (isLoading) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving...
      </Badge>
    );
  }

  const isConfigured = status === 'active' || status === 'configured' || status === 'connected';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Badge 
              variant={isConfigured ? 'default' : 'secondary'}
              className={`flex items-center gap-1.5 cursor-help ${
                isConfigured 
                  ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200 dark:bg-green-900/30 dark:text-green-300' 
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {isConfigured ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {label || (isConfigured ? 'Active' : 'Not Configured')}
            </Badge>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-semibold">{isConfigured ? 'Saved & Active' : 'No active configuration'}</p>
            {timestamp && <p className="text-muted-foreground">Last saved: {new Date(timestamp).toLocaleString()}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SettingsStatusBadge;
