
import { v4 as uuidv4 } from 'uuid';
import { invoiceDataService } from './invoiceDataService';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';
import { addDays, format } from 'date-fns';

export const invoiceGenerationService = {
  /**
   * Generates an initial invoice for a newly created user based on their plan
   */
  generateInitialInvoice: async (user) => {
    if (!user || !user.plan) return null;
    
    // Find plan details
    const plan = SUBSCRIPTION_PLANS.find(p => p.name.toLowerCase() === user.plan.toLowerCase()) || 
                 SUBSCRIPTION_PLANS.find(p => p.id === 'plan_free');
                 
    const isPaidPlan = plan.price.monthly > 0;
    const amount = isPaidPlan ? plan.price.monthly : 0;
    
    const now = new Date();
    const dueDate = addDays(now, 7); // Due in 7 days
    
    const invoiceData = {
      id: `INV-${format(now, 'yyyy')}-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      date: now.toISOString(),
      dueDate: dueDate.toISOString(),
      amount: amount,
      currency: 'USD',
      status: isPaidPlan ? 'pending' : 'paid', // Free plans are automatically paid
      description: `${plan.name} Plan - Monthly Subscription`,
      companyName: 'Munal AI',
      items: [
        {
          description: `${plan.name} Plan Subscription (Monthly)`,
          quantity: 1,
          unitPrice: amount,
          amount: amount
        }
      ],
      billingDetails: {
        name: user.name,
        email: user.email,
        address: "123 Digital Way, Cloud City" // Mock address
      }
    };

    return await invoiceDataService.createInvoice(invoiceData);
  },

  /**
   * Regenerates an invoice for an existing user (e.g. manual trigger or plan change)
   */
  regenerateInvoice: async (user) => {
    return invoiceGenerationService.generateInitialInvoice(user);
  },

  /**
   * Generate next cycle invoice
   */
  generateCycleInvoice: async (user) => {
     return null; 
  }
};
