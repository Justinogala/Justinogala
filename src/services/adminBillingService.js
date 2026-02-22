
import { v4 as uuidv4 } from 'uuid';

const PLANS_KEY = 'echoNote_plans';
const INVOICES_KEY = 'echoNote_invoices';

const DEFAULT_PLANS = [
  { 
    id: 'free', 
    name: 'Free', 
    price: 0, 
    limits: { transcription: 60, storage: 1, members: 1, workspaces: 1 },
    features: { zoom: false, teams: false, analytics: false, support: false }
  },
  { 
    id: 'pro', 
    name: 'Pro', 
    price: 15, 
    limits: { transcription: 300, storage: 10, members: 5, workspaces: 3 },
    features: { zoom: true, teams: true, analytics: true, support: true }
  },
  { 
    id: 'business', 
    name: 'Business', 
    price: 49, 
    limits: { transcription: 1000, storage: 50, members: 20, workspaces: 10 },
    features: { zoom: true, teams: true, analytics: true, support: true }
  }
];

// Initialize if empty
if (!localStorage.getItem(PLANS_KEY)) {
  localStorage.setItem(PLANS_KEY, JSON.stringify(DEFAULT_PLANS));
}

// Generate some mock invoices if empty
if (!localStorage.getItem(INVOICES_KEY)) {
  const mockInvoices = Array.from({ length: 15 }).map((_, i) => ({
    id: `inv_${uuidv4().slice(0, 8)}`,
    userEmail: `user${i}@example.com`,
    plan: i % 3 === 0 ? 'Business' : 'Pro',
    amount: i % 3 === 0 ? 49.00 : 15.00,
    status: i === 0 ? 'pending' : 'paid',
    date: new Date(Date.now() - i * 86400000).toISOString()
  }));
  localStorage.setItem(INVOICES_KEY, JSON.stringify(mockInvoices));
}

export const getPlans = async () => {
  return JSON.parse(localStorage.getItem(PLANS_KEY));
};

export const updatePlan = async (planId, updates) => {
  const plans = JSON.parse(localStorage.getItem(PLANS_KEY));
  const index = plans.findIndex(p => p.id === planId);
  if (index !== -1) {
    plans[index] = { ...plans[index], ...updates };
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
    return plans[index];
  }
  throw new Error("Plan not found");
};

export const getInvoices = async (page = 1, limit = 10, search = '') => {
  await new Promise(r => setTimeout(r, 400));
  let invoices = JSON.parse(localStorage.getItem(INVOICES_KEY));

  if (search) {
    invoices = invoices.filter(i => i.userEmail.toLowerCase().includes(search.toLowerCase()) || i.id.includes(search));
  }

  const total = invoices.length;
  const start = (page - 1) * limit;
  return {
    invoices: invoices.slice(start, start + limit),
    total,
    totalPages: Math.ceil(total / limit)
  };
};

export const getBillingStats = async () => {
  return {
    mrr: 12450,
    activeSubs: 842,
    churnRate: 2.1,
    ltv: 450
  };
};
