
export const PAYMENT_CONFIG = {
  COMPANY_NAME: 'Munal AI',
  PROVIDERS: {
    STRIPE: 'stripe',
    RAZORPAY: 'razorpay'
  },
  CURRENCY: {
    USD: {
      code: 'USD',
      symbol: '$',
      rate: 1
    },
    INR: {
      code: 'INR',
      symbol: '₹',
      rate: 83.5 // Approx exchange rate
    }
  },
  TAX: {
    DEFAULT_RATE: 0.18, // 18% GST/Tax
    INCLUSIVE: false
  },
  KEYS: {
    STRIPE_PUBLIC_KEY: import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_mock_stripe_key',
    RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mock_key_id'
  },
  ENDPOINTS: {
    CREATE_PAYMENT_INTENT: '/api/create-payment-intent',
    CREATE_ORDER: '/api/create-order',
    VERIFY_PAYMENT: '/api/verify-payment',
    WEBHOOK_STRIPE: '/api/webhooks/stripe',
    WEBHOOK_RAZORPAY: '/api/webhooks/razorpay'
  }
};
