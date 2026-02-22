
const PRIVACY_POLICY_KEY = 'munal_privacy_policy';

const DEFAULT_POLICY = {
  id: 'pp_v1',
  version: '1.0.0',
  content: 'Default Privacy Policy content...',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const getStoredPolicies = () => {
  try {
    const policies = JSON.parse(localStorage.getItem(PRIVACY_POLICY_KEY) || '[]');
    if (policies.length === 0) return [DEFAULT_POLICY];
    return policies;
  } catch {
    return [DEFAULT_POLICY];
  }
};

export const privacyPolicyService = {
  getPrivacyPolicy: () => {
    const policies = getStoredPolicies();
    // Return latest
    return policies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  },

  updatePrivacyPolicy: (newContent, version) => {
    const policies = getStoredPolicies();
    const newPolicy = {
      id: `pp_${version.replace(/\./g, '_')}`,
      version,
      content: newContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    policies.push(newPolicy);
    localStorage.setItem(PRIVACY_POLICY_KEY, JSON.stringify(policies));
    
    // In a real app, trigger notifications here
    return newPolicy;
  },

  getPolicyVersion: (version) => {
    const policies = getStoredPolicies();
    return policies.find(p => p.version === version);
  },

  getPolicyHistory: () => {
    return getStoredPolicies().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};
