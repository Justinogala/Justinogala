
import { SUBSCRIPTION_PLANS, getPlanById } from '@/config/subscriptionPlans';
import { generatePlanLimitNotification } from '@/utils/notificationGenerators';

const USAGE_KEY = 'munal_usage_metrics';

export const usageTrackingService = {
  /**
   * Get current usage for a user
   * @param {string} userId
   */
  getUserUsage: (userId) => {
    const allUsage = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}');
    
    // Initialize if not exists
    if (!allUsage[userId]) {
      allUsage[userId] = {
        periodStart: new Date().toISOString(),
        transcriptions: 0,
        audioMinutes: 0,
        storageGB: 0,
        apiCalls: 0
      };
      localStorage.setItem(USAGE_KEY, JSON.stringify(allUsage));
    }
    
    return allUsage[userId];
  },

  /**
   * Check if user can perform action based on limits
   * @param {string} userId 
   * @param {string} planId 
   * @param {string} metricKey - 'transcriptions', 'audioMinutes', 'storageGB', 'apiCalls'
   * @param {number} amountToAdd 
   */
  checkLimit: (userId, planId, metricKey, amountToAdd = 1) => {
    const plan = getPlanById(planId);
    const usage = usageTrackingService.getUserUsage(userId);
    
    // Check for unlimited (-1 or very high number)
    const limit = plan.limits[metricKey];
    if (limit === -1 || limit > 900000) return true; 

    // NOTIFICATION TRIGGER: Check if approaching limit (80%)
    const currentUsage = usage[metricKey] + amountToAdd;
    if (currentUsage >= limit * 0.8 && currentUsage < limit) {
       generatePlanLimitNotification(metricKey, currentUsage, limit);
    }

    if ((usage[metricKey] + amountToAdd) > limit) {
      // Trigger limit reached notification
      generatePlanLimitNotification(metricKey, usage[metricKey], limit);
      return false;
    }
    return true;
  },

  /**
   * Increment usage metric
   * @param {string} userId 
   * @param {string} metricKey 
   * @param {number} amount 
   */
  trackUsage: (userId, metricKey, amount = 1) => {
    const allUsage = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}');
    if (!allUsage[userId]) {
       usageTrackingService.getUserUsage(userId); // Initialize
       return usageTrackingService.trackUsage(userId, metricKey, amount); // Retry
    }

    allUsage[userId][metricKey] = (allUsage[userId][metricKey] || 0) + amount;
    allUsage[userId].lastUpdated = new Date().toISOString();
    
    localStorage.setItem(USAGE_KEY, JSON.stringify(allUsage));
    return allUsage[userId];
  },

  /**
   * Reset usage (e.g., new billing cycle)
   * @param {string} userId 
   */
  resetUsage: (userId) => {
    const allUsage = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}');
    if (allUsage[userId]) {
      allUsage[userId] = {
        ...allUsage[userId],
        transcriptions: 0,
        audioMinutes: 0,
        apiCalls: 0,
        periodStart: new Date().toISOString()
        // Note: Storage usually persists across cycles, so we don't reset it
      };
      localStorage.setItem(USAGE_KEY, JSON.stringify(allUsage));
    }
  }
};
