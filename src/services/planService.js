
export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    limits: {
      members: 3,
      storage: 10, // GB
      workspaces: 1
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    limits: {
      members: 10,
      storage: 100, // GB
      workspaces: 5
    }
  },
  {
    id: 'business',
    name: 'Business',
    limits: {
      members: "Unlimited",
      storage: 1000, // GB
      workspaces: "Unlimited"
    }
  }
];

export const getDefaultPlans = () => {
  return PLANS;
};

export const getPlanLimits = (planId) => {
  const plan = PLANS.find(p => p.id === planId) || PLANS[0];
  return plan.limits;
};

export const getMemberLimit = (planId) => {
  const limits = getPlanLimits(planId);
  return limits.members;
};

export const getStorageLimit = (planId) => {
  const limits = getPlanLimits(planId);
  return limits.storage;
};

export const getWorkspaceLimit = (planId) => {
  const limits = getPlanLimits(planId);
  return limits.workspaces;
};
