
import { useState, useEffect, useCallback } from 'react';
import { usageTrackingService } from '@/services/usageTrackingService';
import { stripeService } from '@/services/stripeService';
import { useAuth } from '@/context/AuthContext';
import { getPlanById } from '@/config/subscriptionPlans';

export const useUserBilling = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState(null);
  const [plan, setPlan] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);

  const fetchBillingData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get Plan
      const currentPlanId = user.plan || 'plan_free';
      const planDetails = getPlanById(currentPlanId);
      setPlan(planDetails);

      // Get Usage
      const usageData = usageTrackingService.getUserUsage(user.id);
      setUsage(usageData);

      // Get History
      const history = await stripeService.getBillingHistory(user.id);
      setBillingHistory(history);

    } catch (error) {
      console.error('Failed to load billing data', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBillingData();
    // Poll for updates every 5 mins
    const interval = setInterval(fetchBillingData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchBillingData]);

  const checkLimit = (metricKey, amount = 1) => {
    if (!user || !plan) return false;
    return usageTrackingService.checkLimit(user.id, plan.id, metricKey, amount);
  };

  const trackAction = (metricKey, amount = 1) => {
    if (!user) return;
    const newUsage = usageTrackingService.trackUsage(user.id, metricKey, amount);
    setUsage(newUsage);
  };

  const upgradeSubscription = async (newPlanId, interval = 'monthly') => {
    try {
      setLoading(true);
      const result = await stripeService.createSubscription(user.id, newPlanId, interval);
      
      // Update local user profile
      await updateProfile({
        plan: newPlanId,
        subscriptionStatus: 'active',
        subscriptionId: result.subscriptionId
      });
      
      await fetchBillingData();
      return true;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    plan,
    usage,
    billingHistory,
    checkLimit,
    trackAction,
    upgradeSubscription,
    refresh: fetchBillingData
  };
};
