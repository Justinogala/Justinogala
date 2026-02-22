
import { adminUserDataService } from './adminUserDataService';

const INVOICE_KEY = 'munal_invoices';

// Helper to get invoices from storage
const getLocalInvoices = () => {
  try {
    const data = localStorage.getItem(INVOICE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error reading invoices", e);
    return [];
  }
};

// Helper to save invoices to storage
const setLocalInvoices = (invoices) => {
  localStorage.setItem(INVOICE_KEY, JSON.stringify(invoices));
};

export const invoiceDataService = {
  getAllInvoices: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const invoices = getLocalInvoices();
    const users = await adminUserDataService.getAllUsers();
    
    // Enrich invoices with user data to ensure consistency
    return invoices.map(invoice => {
      const user = users.find(u => u.id === invoice.userId);
      if (user) {
        return {
          ...invoice,
          userName: user.name,
          userEmail: user.email,
          userPlan: user.plan // Ensure plan is up to date
        };
      }
      return invoice; // Keep invoice even if user is deleted (archived)
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getInvoicesByUserId: async (userId) => {
    const invoices = await invoiceDataService.getAllInvoices();
    return invoices.filter(inv => inv.userId === userId);
  },

  getInvoiceById: async (id) => {
    const invoices = await invoiceDataService.getAllInvoices();
    return invoices.find(inv => inv.id === id);
  },

  createInvoice: async (invoiceData) => {
    const invoices = getLocalInvoices();
    
    const newInvoice = {
      ...invoiceData,
      createdAt: new Date().toISOString(),
      status: invoiceData.status || 'draft' // draft, sent, paid, overdue, void
    };

    const updatedInvoices = [newInvoice, ...invoices];
    setLocalInvoices(updatedInvoices);
    return newInvoice;
  },

  updateInvoice: async (id, updates) => {
    const invoices = getLocalInvoices();
    const index = invoices.findIndex(i => i.id === id);
    
    if (index === -1) {
      throw new Error('Invoice not found');
    }

    const updatedInvoice = { ...invoices[index], ...updates };
    invoices[index] = updatedInvoice;
    setLocalInvoices(invoices);
    return updatedInvoice;
  },

  deleteInvoice: async (id) => {
    const invoices = getLocalInvoices();
    const filteredInvoices = invoices.filter(i => i.id !== id);
    setLocalInvoices(filteredInvoices);
    return true;
  },
  
  // Update invoice status based on logic (e.g. mark overdue)
  checkAndMarkOverdue: async () => {
    const invoices = getLocalInvoices();
    const now = new Date();
    let changed = false;

    const updatedInvoices = invoices.map(inv => {
      if (inv.status === 'sent' || inv.status === 'pending') {
        if (inv.dueDate && new Date(inv.dueDate) < now) {
          changed = true;
          return { ...inv, status: 'overdue' };
        }
      }
      return inv;
    });

    if (changed) {
      setLocalInvoices(updatedInvoices);
    }
    return changed;
  }
};
