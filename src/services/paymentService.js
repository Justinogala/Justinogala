
import { PAYMENT_CONFIG } from '@/config/paymentConfig';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock storage for payments
const PAYMENTS_KEY = 'munal_payments';

const getStoredPayments = () => {
  try {
    return JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '[]');
  } catch {
    return [];
  }
};

const storePayment = (payment) => {
  const payments = getStoredPayments();
  payments.push(payment);
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
  return payment;
};

export const paymentService = {
  /**
   * Create a mock Stripe Checkout Session
   */
  createStripeSession: async (planId, amount, currency, userId) => {
    await delay(1000);
    // In a real app, this calls the backend to create a Stripe session
    return {
      id: `cs_test_${Math.random().toString(36).substr(2, 9)}`,
      url: `/checkout/success?session_id=cs_test_mock`, // Mock redirect
      clientSecret: `pi_test_${Math.random().toString(36).substr(2, 9)}_secret`
    };
  },

  /**
   * Create a mock Razorpay Order
   */
  createRazorpayOrder: async (planId, amount, currency, userId) => {
    await delay(1000);
    // In a real app, calls backend to create order via Razorpay API
    return {
      id: `order_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount * 100, // Amount in paise
      currency: currency,
      key: PAYMENT_CONFIG.KEYS.RAZORPAY_KEY_ID
    };
  },

  /**
   * Verify mock payment
   */
  verifyPayment: async (paymentDetails) => {
    await delay(1500);
    
    // Simulate randomness in success (mostly success for demo)
    const isSuccess = true;

    if (isSuccess) {
      const record = {
        id: `pay_${Math.random().toString(36).substr(2, 9)}`,
        userId: paymentDetails.userId,
        planId: paymentDetails.planId,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        provider: paymentDetails.provider,
        status: 'succeeded',
        createdAt: new Date().toISOString(),
        method: paymentDetails.method || 'card'
      };
      
      storePayment(record);
      return { success: true, paymentRecord: record };
    } else {
      return { success: false, error: 'Payment verification failed' };
    }
  },

  /**
   * Get payments for a user
   */
  getUserPayments: async (userId) => {
    await delay(500);
    const allPayments = getStoredPayments();
    return allPayments.filter(p => p.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};
