
import { v4 as uuidv4 } from 'uuid';
import { addDays, subDays, subMonths } from 'date-fns';

const USERS_KEY = 'munal_users';
const INVOICES_KEY = 'munal_invoices';
const PAYMENTS_KEY = 'munal_payments';
const PAYMENT_METHODS_KEY = 'munal_payment_methods';

export const initializeMockData = () => {
  if (localStorage.getItem(USERS_KEY) && localStorage.getItem(INVOICES_KEY)) {
    return; // Data already exists
  }

  // Mock Users
  const users = Array.from({ length: 10 }).map((_, i) => ({
    id: uuidv4(),
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: i === 0 ? 'admin' : (i % 3 === 0 ? 'premium' : 'free'),
    status: i % 5 === 0 ? 'suspended' : 'active',
    plan: i % 3 === 0 ? 'Pro Plan' : 'Free Plan',
    joinDate: subDays(new Date(), i * 10).toISOString(),
    lastLogin: subDays(new Date(), i).toISOString(),
  }));

  // Ensure an admin user exists if not already (though usually handled by AuthContext)
  
  // Mock Invoices & Payments
  const invoices = [];
  const payments = [];
  const paymentMethods = [];

  users.forEach(user => {
    // Payment Methods
    if (user.role !== 'free') {
      paymentMethods.push({
        id: uuidv4(),
        userId: user.id,
        type: 'Visa',
        last4: Math.floor(1000 + Math.random() * 9000).toString(),
        expiryDate: '12/25',
        isDefault: true
      });
    }

    // Invoices for last 3 months
    for (let m = 0; m < 3; m++) {
      if (user.role !== 'free') {
        const invoiceId = uuidv4();
        const date = subMonths(new Date(), m).toISOString();
        const amount = user.plan === 'Pro Plan' ? 29.00 : 99.00;
        
        invoices.push({
          id: invoiceId,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          amount: amount,
          date: date,
          status: 'paid',
          dueDate: addDays(new Date(date), 14).toISOString(),
          description: `${user.plan} - Monthly Subscription`
        });

        payments.push({
          id: uuidv4(),
          invoiceId: invoiceId,
          userId: user.id,
          amount: amount,
          date: addDays(new Date(date), 1).toISOString(),
          method: 'Credit Card',
          status: 'completed'
        });
      }
    }
  });

  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
  localStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(paymentMethods));
  
  console.log('Mock Data Initialized');
};

export const clearAllData = () => {
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(INVOICES_KEY);
  localStorage.removeItem(PAYMENTS_KEY);
  localStorage.removeItem(PAYMENT_METHODS_KEY);
  window.location.reload();
};

export const syncDataAcrossServices = () => {
  // In a real app with localStorage, listeners would be used. 
  // Here we just ensure initialization.
  initializeMockData();
};
