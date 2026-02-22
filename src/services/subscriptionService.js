
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';
import { v4 as uuidv4 } from 'uuid';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const SUB_KEY = 'munal_subscriptions';

const getSubs = () => {
  try {
    return JSON.parse(localStorage.getItem(SUB_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveSubs = (subs) => {
  localStorage.setItem(SUB_KEY, JSON.stringify(subs));
};

export const subscriptionService = {
  getUserSubscription: async (userId) => {
    await delay(600);
    const subs = getSubs();
    const userSub = subs.find(s => s.userId === userId && s.status === 'active');
    
    if (!userSub) {
      // Default to free plan if no active subscription
      return {
        id: 'sub_default_free',
        userId,
        planId: 'plan_free',
        status: 'active',
        startDate: new Date().toISOString(),
        currentPeriodEnd: null // Forever for free
      };
    }
    return userSub;
  },

  createSubscription: async (userId, planId, paymentId) => {
    await delay(1000);
    const subs = getSubs();
    
    // Cancel existing active subscriptions
    const updatedSubs = subs.map(s => 
      (s.userId === userId && s.status === 'active') 
        ? { ...s, status: 'canceled', canceledAt: new Date().toISOString() } 
        : s
    );

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(now.getMonth() + 1);

    const newSub = {
      id: `sub_${uuidv4()}`,
      userId,
      planId,
      paymentId,
      status: 'active',
      startDate: now.toISOString(),
      currentPeriodEnd: nextMonth.toISOString(),
      amount: plan.price.USD, // simplified
      interval: plan.interval
    };

    updatedSubs.push(newSub);
    saveSubs(updatedSubs);
    return { success: true, subscription: newSub };
  },

  cancelSubscription: async (subscriptionId) => {
    await delay(800);
    const subs = getSubs();
    const updatedSubs = subs.map(s => 
      s.id === subscriptionId 
        ? { ...s, status: 'canceled', canceledAt: new Date().toISOString() } 
        : s
    );
    saveSubs(updatedSubs);
    return { success: true };
  },

  changePlan: async (userId, newPlanId) => {
    // Logic: Create new subscription, cancel old
    // Mocking this by just calling createSubscription
    return subscriptionService.createSubscription(userId, newPlanId, 'upgrade_payment_mock');
  }
};
