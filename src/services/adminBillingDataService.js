
import { initializeMockData } from '@/utils/dataInitialization';

const INVOICES_KEY = 'munal_invoices';
const PAYMENTS_KEY = 'munal_payments';
const PAYMENT_METHODS_KEY = 'munal_payment_methods';
const USERS_KEY = 'munal_users';

// Ensure data exists
initializeMockData();

const getLocal = (key) => JSON.parse(localStorage.getItem(key) || '[]');

export const adminBillingDataService = {
  getAllUsers: async () => {
    return getLocal(USERS_KEY);
  },

  getUserById: async (id) => {
    const users = getLocal(USERS_KEY);
    return users.find(u => u.id === id);
  },

  getAllInvoices: async () => {
    return getLocal(INVOICES_KEY);
  },

  getInvoicesByUserId: async (userId) => {
    const invoices = getLocal(INVOICES_KEY);
    return invoices.filter(inv => inv.userId === userId);
  },

  getPaymentsByUserId: async (userId) => {
    const payments = getLocal(PAYMENTS_KEY);
    return payments.filter(p => p.userId === userId);
  },

  getPaymentMethods: async (userId) => {
    const methods = getLocal(PAYMENT_METHODS_KEY);
    return userId ? methods.filter(m => m.userId === userId) : methods;
  },

  getBillingStats: async () => {
    const invoices = getLocal(INVOICES_KEY);
    const users = getLocal(USERS_KEY);
    
    const totalRevenue = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount, 0);
      
    const pendingAmount = invoices
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + i.amount, 0);

    const activeSubscriptions = users.filter(u => u.role !== 'free' && u.status === 'active').length;

    return {
      totalRevenue,
      pendingAmount,
      activeSubscriptions,
      totalInvoices: invoices.length
    };
  }
};
