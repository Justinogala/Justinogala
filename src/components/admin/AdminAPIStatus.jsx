
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminSettings } from '@/context/AdminSettingsContext';
import { Activity, Key, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const AdminAPIStatus = () => {
  const { apiConfig, loading } = useAdminSettings();
  const navigate = useNavigate();

  if (loading || !apiConfig) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <Card className="h-full border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/admin/api-settings')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">API Health</CardTitle>
          <Key className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4 pt-2">
            {/* OpenAI Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">OpenAI</span>
                {getStatusIcon(apiConfig.openai.status)}
              </div>
              <Badge variant="outline" className={getStatusColor(apiConfig.openai.status)}>
                {apiConfig.openai.status}
              </Badge>
            </div>
            
            {/* Google Cloud Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Google Cloud</span>
                {getStatusIcon(apiConfig.googleCloud.status)}
              </div>
              <Badge variant="outline" className={getStatusColor(apiConfig.googleCloud.status)}>
                {apiConfig.googleCloud.status}
              </Badge>
            </div>

            <div className="pt-2 text-xs text-muted-foreground flex justify-between items-center">
              <span>Last Check: {new Date().toLocaleTimeString()}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminAPIStatus;
