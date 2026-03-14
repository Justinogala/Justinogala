import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, X, TrendingUp, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

import { getApiUrl, API_URL } from '@/lib/api';

const UsageAlertsWidget = ({ className }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetchAlerts();
      // Check for new alerts every 5 minutes
      const interval = setInterval(checkForNewAlerts, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/usage-alerts/user/${user.id}?unread_only=true`);
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForNewAlerts = async () => {
    try {
      await fetch(`${API_URL}/api/usage-alerts/check/${user.id}`, { method: 'POST' });
      fetchAlerts();
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  };

  const dismissAlert = async (alertId) => {
    setDismissed([...dismissed, alertId]);
    try {
      await fetch(`${API_URL}/api/usage-alerts/user/${user.id}/mark-read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_ids: [alertId] })
      });
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const getAlertColor = (alertType) => {
    switch (alertType) {
      case 'limit_exceeded':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'limit_reached':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'warning_90':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    }
  };

  const getAlertIcon = (alertType) => {
    if (alertType === 'limit_exceeded' || alertType === 'limit_reached') {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
    return <TrendingUp className="w-5 h-5 text-amber-500" />;
  };

  const visibleAlerts = alerts.filter(a => !dismissed.includes(a.id)).slice(0, 3);

  if (loading || visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {visibleAlerts.map((alert) => (
        <Card 
          key={alert.id}
          className={cn(
            "border transition-all hover:shadow-md",
            getAlertColor(alert.alert_type)
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getAlertIcon(alert.alert_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm capitalize">
                    {alert.feature.replace('_', ' ')}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs",
                      alert.alert_type === 'limit_exceeded' && "bg-red-100 text-red-700",
                      alert.alert_type === 'limit_reached' && "bg-orange-100 text-orange-700",
                      alert.alert_type === 'warning_90' && "bg-amber-100 text-amber-700",
                      alert.alert_type === 'warning_80' && "bg-yellow-100 text-yellow-700"
                    )}
                  >
                    {Math.round(alert.percentage)}% used
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {alert.message}
                </p>
                <Progress 
                  value={Math.min(100, alert.percentage)} 
                  className={cn(
                    "h-1.5",
                    alert.percentage >= 100 && "[&>div]:bg-red-500",
                    alert.percentage >= 90 && alert.percentage < 100 && "[&>div]:bg-orange-500",
                    alert.percentage >= 80 && alert.percentage < 90 && "[&>div]:bg-amber-500"
                  )}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  onClick={() => navigate('/plans')}
                >
                  Upgrade
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-gray-600"
                  onClick={() => dismissAlert(alert.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default UsageAlertsWidget;
