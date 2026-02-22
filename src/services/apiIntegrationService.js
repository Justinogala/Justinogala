
import { adminBillingDataService } from './adminBillingDataService';
import { adminUserDataService } from './adminUserDataService';

// This service acts as a unified facade for API calls
// Currently maps to local storage services, but ready for real API replacement

export const apiIntegrationService = {
  // --- Admin Endpoints ---
  getAdminUsers: async () => {
    try {
      return await adminUserDataService.getAllUsers();
    } catch (error) {
      console.error('API Error: getAdminUsers', error);
      throw error;
    }
  },

  getAdminBillingData: async () => {
    try {
      return await adminBillingDataService.getBillingStats();
    } catch (error) {
      console.error('API Error: getAdminBillingData', error);
      throw error;
    }
  },

  getAdminInvoices: async () => {
    try {
      return await adminBillingDataService.getAllInvoices();
    } catch (error) {
      console.error('API Error: getAdminInvoices', error);
      throw error;
    }
  },

  updateAdminUser: async (id, data) => {
    try {
      return await adminUserDataService.updateUser(id, data);
    } catch (error) {
      console.error('API Error: updateAdminUser', error);
      throw error;
    }
  },

  // --- User Endpoints ---
  getUserBillingData: async (userId) => {
    try {
      const invoices = await adminBillingDataService.getInvoicesByUserId(userId);
      const methods = await adminBillingDataService.getPaymentMethods(userId);
      const user = await adminUserDataService.getUserById(userId);
      return { invoices, methods, plan: user?.plan };
    } catch (error) {
      console.error('API Error: getUserBillingData', error);
      throw error;
    }
  },

  downloadInvoice: async (invoiceId) => {
    // Simulate API delay and PDF generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, url: `/mock-invoice-${invoiceId}.pdf` };
  }
};
