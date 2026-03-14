import { getApiUrl, API_URL } from '@/lib/api';

export const adminBillingDataService = {
  getAllUsers: async () => {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/api/users`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : (data.users || []);
  },

  getUserById: async (id) => {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/api/users/${id}`);
    if (!response.ok) return null;
    return await response.json();
  },

  getAllInvoices: async () => {
    return [];
  },

  getInvoicesByUserId: async (userId) => {
    return [];
  },

  getPaymentsByUserId: async (userId) => {
    return [];
  },

  getPaymentMethods: async (userId) => {
    return [];
  },

  getBillingStats: async () => {
    const users = await adminBillingDataService.getAllUsers();
    const activeSubscriptions = users.filter(u => u.plan === 'Pro' || u.plan === 'Enterprise').length;
    return {
      totalRevenue: 0,
      pendingAmount: 0,
      activeSubscriptions,
      totalInvoices: 0
    };
  }
};
