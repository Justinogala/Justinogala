import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Mic, 
  HardDrive, 
  MessageSquare, 
  Users, 
  AlertTriangle,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getUsageSummary } from '@/services/entitlementsService';
import { cn } from '@/lib/utils';

const UsageDashboard = ({ compact = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchUsage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const data = await getUsageSummary(user.id);
      setUsageData(data);
    } catch (error) {
      console.error('Error fetching usage:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load usage data'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-amber-600 bg-amber-50';
      default: return 'text-emerald-600 bg-emerald-50';
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-amber-500';
      default: return 'bg-emerald-500';
    }
  };

  const usageItems = [
    {
      key: 'meetings',
      label: 'Meetings',
      icon: Video,
      unit: '/month'
    },
    {
      key: 'transcription',
      label: 'Transcription',
      icon: Mic,
      unit: 'min'
    },
    {
      key: 'storage',
      label: 'Storage',
      icon: HardDrive,
      unit: 'GB'
    },
    {
      key: 'ai_chat',
      label: 'AI Messages',
      icon: MessageSquare,
      unit: '/month'
    },
    {
      key: 'workspaces',
      label: 'Workspaces',
      icon: Users,
      unit: ''
    }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usageData) {
    return null;
  }

  const { plan, summary, needs_upgrade } = usageData;

  if (compact) {
    // Compact version for sidebar/header
    return (
      <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{plan} Plan</span>
          {needs_upgrade && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Limits
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          {usageItems.slice(0, 3).map(item => {
            const usage = summary[item.key];
            if (!usage) return null;
            const pct = usage.percentage || 0;
            return (
              <div key={item.key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{item.label}</span>
                  <span className={cn(
                    'font-medium',
                    usage.status === 'critical' && 'text-red-600',
                    usage.status === 'warning' && 'text-amber-600'
                  )}>
                    {usage.current}/{usage.limit === '∞' ? '∞' : usage.limit}
                  </span>
                </div>
                <Progress 
                  value={pct} 
                  className="h-1"
                  indicatorClassName={getProgressColor(usage.status)}
                />
              </div>
            );
          })}
        </div>
        {needs_upgrade && (
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full text-xs"
            onClick={() => navigate('/pricing')}
          >
            Upgrade Plan
            <ArrowUpRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    );
  }

  // Full dashboard view
  return (
    <Card data-testid="usage-dashboard">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Usage & Limits</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Current plan: <span className="font-medium">{plan}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {needs_upgrade && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Approaching Limits
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/pricing')}
            >
              Upgrade
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {usageItems.map(item => {
            const usage = summary[item.key];
            if (!usage) return null;
            
            const Icon = item.icon;
            const pct = usage.percentage || 0;
            const isUnlimited = usage.limit === '∞' || usage.limit === 'Unlimited';

            return (
              <div 
                key={item.key}
                className={cn(
                  'p-4 rounded-lg border transition-colors',
                  usage.status === 'critical' && 'border-red-200 bg-red-50/50',
                  usage.status === 'warning' && 'border-amber-200 bg-amber-50/50',
                  usage.status === 'ok' && 'border-gray-200'
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    getStatusColor(usage.status)
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">
                      {usage.current}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {isUnlimited ? '∞' : usage.limit} {item.unit}
                    </span>
                  </div>
                  
                  {!isUnlimited && (
                    <Progress 
                      value={pct} 
                      className="h-2"
                      indicatorClassName={getProgressColor(usage.status)}
                    />
                  )}
                  
                  {isUnlimited ? (
                    <p className="text-xs text-emerald-600">Unlimited</p>
                  ) : (
                    <p className={cn(
                      'text-xs',
                      usage.status === 'critical' && 'text-red-600',
                      usage.status === 'warning' && 'text-amber-600',
                      usage.status === 'ok' && 'text-gray-500'
                    )}>
                      {pct.toFixed(0)}% used
                      {usage.status === 'critical' && ' - Upgrade needed'}
                      {usage.status === 'warning' && ' - Consider upgrading'}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageDashboard;
