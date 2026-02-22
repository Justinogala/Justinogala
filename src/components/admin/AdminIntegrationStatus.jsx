
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminSettings } from '@/context/AdminSettingsContext';
import { Zap, AlertTriangle, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const AdminIntegrationStatus = () => {
  const { integrationConfig, loading } = useAdminSettings();
  const navigate = useNavigate();

  if (loading || !integrationConfig) return null;

  const activeCount = Object.values(integrationConfig).filter(i => i.enabled).length;
  const errorCount = Object.values(integrationConfig).filter(i => i.status === 'error').length;

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <Card className="h-full border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/admin/integrations')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Integrations</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between pt-2">
            <div>
              <div className="text-2xl font-bold">{activeCount}</div>
              <p className="text-xs text-muted-foreground">Active Services</p>
            </div>
            {errorCount > 0 ? (
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {errorCount} Issues
              </Badge>
            ) : (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                <Check className="h-3 w-3" /> All Healthy
              </Badge>
            )}
          </div>
          
          <div className="mt-4 flex gap-1 flex-wrap">
            {Object.entries(integrationConfig).slice(0, 5).map(([key, val]) => (
              <div 
                key={key} 
                className={`w-2 h-2 rounded-full ${val.enabled ? (val.status === 'error' ? 'bg-red-500' : 'bg-green-500') : 'bg-gray-200 dark:bg-slate-700'}`}
                title={key}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminIntegrationStatus;
