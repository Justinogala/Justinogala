
const GDPR_CONSENT_KEY = 'munal_gdpr_consent';
const USERS_KEY = 'munal_users';

const getStoredConsent = () => {
  try {
    return JSON.parse(localStorage.getItem(GDPR_CONSENT_KEY) || '{}');
  } catch {
    return {};
  }
};

export const gdprComplianceService = {
  getUserData: (userId) => {
    // Collect all data related to user from various storage keys
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find(u => u.id === userId);
    
    if (!user) return null;

    // Simulate collecting related data (meetings, files, etc.)
    // In a real app, this would query all tables/stores
    return {
      profile: user,
      settings: JSON.parse(localStorage.getItem(`user_settings_${userId}`) || '{}'),
      // Add other related data placeholders
      exportedAt: new Date().toISOString()
    };
  },

  exportUserData: (userId) => {
    const data = gdprComplianceService.getUserData(userId);
    if (!data) return null;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `munal_user_data_${userId}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    return true;
  },

  deleteUserData: (userId) => {
    // Soft delete logic
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex].deleted = true;
      users[userIndex].deletedAt = new Date().toISOString();
      // Remove PII
      users[userIndex].email = `deleted_${userId}@example.com`;
      users[userIndex].full_name = 'Deleted User';
      
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      // Clear consent
      const consents = getStoredConsent();
      delete consents[userId];
      localStorage.setItem(GDPR_CONSENT_KEY, JSON.stringify(consents));
      
      return true;
    }
    return false;
  },

  updateConsent: (userId, consentType, granted) => {
    const consents = getStoredConsent();
    if (!consents[userId]) consents[userId] = {};
    
    // Track history
    const previous = consents[userId][consentType];
    
    consents[userId][consentType] = {
      granted,
      timestamp: new Date().toISOString(),
      previousValue: previous ? previous.granted : null
    };
    
    localStorage.setItem(GDPR_CONSENT_KEY, JSON.stringify(consents));
  },

  getConsent: (userId) => {
    const consents = getStoredConsent();
    return consents[userId] || {
      marketing: { granted: false },
      analytics: { granted: false },
      thirdParty: { granted: false }
    };
  },

  generateGDPRReport: (userId) => {
    const consent = gdprComplianceService.getConsent(userId);
    const data = gdprComplianceService.getUserData(userId);
    
    return {
      userId,
      generatedAt: new Date().toISOString(),
      complianceStatus: 'Compliant', // Logic to determine status
      consentSummary: consent,
      dataRetained: !!data
    };
  }
};
