import { getApiUrl, API_URL } from '@/lib/api';
/**
 * Entitlements Service
 * Handles subscription limits checking and usage tracking
 */

/**
 * Check if user can use a specific feature
 */
export const checkEntitlement = async (userId, feature, amount = 1) => {
  const response = await fetch(
    `${API_URL}/api/entitlements/check/${feature}?user_id=${userId}&amount=${amount}`
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to check entitlement');
  }
  
  return response.json();
};

/**
 * Get user's usage across all features
 */
export const getUserUsage = async (userId) => {
  const response = await fetch(`${API_URL}/api/entitlements/usage/${userId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch usage');
  }
  
  return response.json();
};

/**
 * Record usage for a feature
 */
export const recordUsage = async (userId, feature, amount = 1, metadata = null) => {
  const response = await fetch(`${API_URL}/api/entitlements/record`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      feature,
      amount,
      metadata
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    // Check if it's a limit reached error
    if (response.status === 403) {
      throw {
        code: error.detail?.code || 'LIMIT_REACHED',
        message: error.detail?.message || 'Usage limit reached',
        upgradeRequired: true,
        upgradeUrl: error.detail?.upgrade_url || '/pricing'
      };
    }
    throw new Error(error.detail || 'Failed to record usage');
  }
  
  return response.json();
};

/**
 * Get plan limits
 */
export const getPlanLimits = async (planId) => {
  const response = await fetch(`${API_URL}/api/entitlements/limits/${planId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch limits');
  }
  
  return response.json();
};

/**
 * Get quick usage summary for UI display
 */
export const getUsageSummary = async (userId) => {
  const response = await fetch(`${API_URL}/api/entitlements/summary/${userId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch summary');
  }
  
  return response.json();
};

// Feature keys for easy reference
export const FEATURES = {
  MEETINGS: 'meetings',
  TRANSCRIPTION: 'transcription',
  STORAGE: 'storage',
  AI_CHAT: 'ai_chat',
  WORKSPACES: 'workspaces',
  TEAM_MEMBERS: 'team_members',
  VIDEO: 'video',
  SHIFTS: 'shifts'
};

// Helper to format usage display
export const formatUsage = (current, limit) => {
  if (limit === -1 || limit === 'Unlimited' || limit === '∞') {
    return `${current} / Unlimited`;
  }
  return `${current} / ${limit}`;
};

// Helper to get usage status color
export const getUsageStatusColor = (percentage) => {
  if (percentage >= 90) return 'red';
  if (percentage >= 70) return 'amber';
  return 'green';
};

// Helper to get usage status
export const getUsageStatus = (current, limit) => {
  if (limit === -1 || limit === 'Unlimited') return 'ok';
  const percentage = (current / limit) * 100;
  if (percentage >= 90) return 'critical';
  if (percentage >= 70) return 'warning';
  return 'ok';
};

export default {
  checkEntitlement,
  getUserUsage,
  recordUsage,
  getPlanLimits,
  getUsageSummary,
  FEATURES,
  formatUsage,
  getUsageStatusColor,
  getUsageStatus
};
