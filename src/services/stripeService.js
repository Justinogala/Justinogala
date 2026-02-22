
/**
 * Mock Stripe Service for Frontend Simulation
 * In a real production app, never expose secret keys on the frontend.
 * All sensitive operations should proxy through your backend.
 */

import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY_BILLING = 'munal_billing_history';

// Helper to simulate network latency
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const stripeService = {
  
  /**
   * Initialize Stripe (Mock)
   */
  initialize: () => {
    console.log('Stripe Service Initialized (Mock Mode)');
    return true;
  },

  /**
   * Create a payment intent (Mock)
   * @param {number} amount - Amount in cents
   * @param {string} currency - Currency code
   */
  createPaymentIntent: async (amount, currency = 'usd') => {
    await delay(800);
    return {
      clientSecret: `pi_mock_${uuidv4()}_secret_${uuidv4()}`,
      id: `pi_mock_${uuidv4()}`
    };
  },

  /**
   * Subscribe user to a plan
   * @param {string} userId - User ID
   * @param {string} planId - Plan ID from config
   * @param {string} interval - 'monthly' or 'yearly'
   */
  createSubscription: async (userId, planId, interval = 'monthly') => {
    await delay(1500);
    
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) throw new Error('Invalid plan ID');

    const amount = interval === 'monthly' ? plan.price.monthly : plan.price.yearly;
    
    // Create a mock invoice record
    const invoice = {
      id: `in_${uuidv4()}`,
      userId,
      amount: amount,
      currency: plan.currency,
      status: 'paid',
      planId,
      interval,
      date: new Date().toISOString(),
      periodStart: new Date().toISOString(),
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      invoiceUrl: '#'
    };

    stripeService._saveInvoice(invoice);

    return {
      subscriptionId: `sub_${uuidv4()}`,
      status: 'active',
      currentPeriodEnd: invoice.periodEnd,
      planId: planId
    };
  },

  /**
   * Update existing subscription
   * @param {string} subscriptionId 
   * @param {string} newPlanId 
   */
  updateSubscription: async (subscriptionId, newPlanId) => {
    await delay(1200);
    return {
      id: subscriptionId,
      planId: newPlanId,
      status: 'active',
      updatedAt: new Date().toISOString()
    };
  },

  /**
   * Cancel Subscription
   * @param {string} subscriptionId 
   */
  cancelSubscription: async (subscriptionId) => {
    await delay(1000);
    return {
      id: subscriptionId,
      status: 'canceled',
      cancelAtPeriodEnd: true
    };
  },

  /**
   * Get Billing History for User
   * @param {string} userId 
   */
  getBillingHistory: async (userId) => {
    await delay(500);
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY_BILLING) || '[]');
    return history.filter(h => h.userId === userId).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  // Internal helper
  _saveInvoice: (invoice) => {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY_BILLING) || '[]');
    history.unshift(invoice);
    localStorage.setItem(STORAGE_KEY_BILLING, JSON.stringify(history));
  }
};
