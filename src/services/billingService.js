import { getBillingRecords, getInvoices, getPaymentMethods } from './supabaseService';

// Mock Data for initial population if empty
const MOCK_BILLING_DATA = {
  revenue: 125000,
  growth: 12.5,
  subscriptions: { active: 1500, churn: 2.1 },
  recentTransactions: [
    { id: 'tx_1', user: 'John Doe', plan: 'Pro', amount: 29.00, status: 'paid', date: '2023-10-25' },
    { id: 'tx_2', user: 'Jane Smith', plan: 'Team', amount: 99.00, status: 'paid', date: '2023-10-24' },
    { id: 'tx_3', user: 'Bob Wilson', plan: 'Pro', amount: 29.00, status: 'failed', date: '2023-10-24' },
  ]
};

export const calculateRevenue = async (period = 'month') => {
  // Mock calculation
  return {
    total: 124500,
    growth: 15.2,
    history: [45000, 52000, 48000, 61000, 75000, 89000, 124500]
  };
};

export const getSubscriptionBreakdown = async () => {
  return [
    { name: 'Free', value: 450, color: '#94a3b8' },
    { name: 'Pro', value: 850, color: '#6366f1' },
    { name: 'Team', value: 200, color: '#3b82f6' },
    { name: 'Enterprise', value: 50, color: '#1e293b' }
  ];
};

export const getPaymentMethodBreakdown = async () => {
  return [
    { name: 'Credit Card', value: 75, color: '#3b82f6' },
    { name: 'PayPal', value: 20, color: '#0ea5e9' },
    { name: 'Wire Transfer', value: 5, color: '#64748b' }
  ];
};

export const calculateChurnRate = async () => {
  return {
    rate: 2.4,
    trend: -0.5 // decreasing
  };
};

export const generateRevenueReport = async (dateRange) => {
  return { generatedAt: new Date(), data: MOCK_BILLING_DATA.recentTransactions };
};

export const generateSubscriptionReport = async () => {
  return { active: 1500, new: 120, cancelled: 35 };
};

export const generatePaymentReport = async () => {
  return { successful: 45000, failed: 1200, refunded: 500 };
};

export const generateChurnReport = async () => {
  return { rate: 2.4, reasons: { price: 40, features: 30, support: 10, other: 20 } };
};

export const formatBillingData = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};