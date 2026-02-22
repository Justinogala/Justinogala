
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'munal_payment_gateways';
const LOGS_KEY = 'munal_gateway_logs';

const INITIAL_GATEWAYS = [
  {
    id: 'stripe',
    name: 'Stripe',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
    status: 'active', // active, inactive, error
    enabled: true,
    config: {
      publicKey: 'pk_test_...',
      secretKey: 'sk_test_...',
      webhookUrl: 'https://api.munal.com/webhooks/stripe',
      transactionFee: 2.9,
    },
    lastTested: new Date().toISOString(),
    health: 'healthy'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg',
    status: 'active',
    enabled: true,
    config: {
      clientId: 'client_...',
      clientSecret: 'secret_...',
      mode: 'sandbox',
      transactionFee: 3.4,
    },
    lastTested: new Date().toISOString(),
    health: 'healthy'
  },
  {
    id: 'paystack',
    name: 'Paystack',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Paystack_Logo.png',
    status: 'inactive',
    enabled: false,
    config: {
      publicKey: '',
      secretKey: '',
      transactionFee: 1.5,
    },
    lastTested: null,
    health: 'unknown'
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg',
    status: 'inactive',
    enabled: false,
    config: {
      keyId: '',
      keySecret: '',
      transactionFee: 2.0,
    },
    lastTested: null,
    health: 'unknown'
  },
  {
    id: 'square',
    name: 'Square',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Square_Inc_Logo.svg',
    status: 'inactive',
    enabled: false,
    config: {
      applicationId: '',
      accessToken: '',
      locationId: '',
      transactionFee: 2.6,
    },
    lastTested: null,
    health: 'unknown'
  }
];

// Initialize storage if empty
if (!localStorage.getItem(STORAGE_KEY)) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_GATEWAYS));
}

const getStoredGateways = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
const saveGateways = (gateways) => localStorage.setItem(STORAGE_KEY, JSON.stringify(gateways));

export const paymentGatewayService = {
  getGateways: () => {
    return getStoredGateways();
  },

  getGatewayById: (id) => {
    const gateways = getStoredGateways();
    return gateways.find(g => g.id === id);
  },

  updateGateway: (id, updates) => {
    const gateways = getStoredGateways();
    const index = gateways.findIndex(g => g.id === id);
    if (index !== -1) {
      gateways[index] = { ...gateways[index], ...updates };
      saveGateways(gateways);
      return { success: true, data: gateways[index] };
    }
    return { success: false, message: 'Gateway not found' };
  },

  enableGateway: (id) => {
    const gateways = getStoredGateways();
    const index = gateways.findIndex(g => g.id === id);
    if (index !== -1) {
      gateways[index].enabled = true;
      gateways[index].status = 'active';
      saveGateways(gateways);
      return { success: true };
    }
    return { success: false };
  },

  disableGateway: (id) => {
    const gateways = getStoredGateways();
    const index = gateways.findIndex(g => g.id === id);
    if (index !== -1) {
      gateways[index].enabled = false;
      gateways[index].status = 'inactive';
      saveGateways(gateways);
      return { success: true };
    }
    return { success: false };
  },

  testGatewayConnection: async (id) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const gateways = getStoredGateways();
    const index = gateways.findIndex(g => g.id === id);
    
    if (index !== -1) {
      const success = Math.random() > 0.2; // 80% success rate simulation
      gateways[index].lastTested = new Date().toISOString();
      gateways[index].health = success ? 'healthy' : 'error';
      gateways[index].status = gateways[index].enabled ? (success ? 'active' : 'error') : 'inactive';
      saveGateways(gateways);
      
      return success 
        ? { success: true, message: 'Connection successful' } 
        : { success: false, message: 'Connection failed: Invalid API credentials' };
    }
    return { success: false, message: 'Gateway not found' };
  },

  getGatewayStatistics: (id) => {
    // Mock statistics generation
    return {
      totalTransactions: Math.floor(Math.random() * 1000) + 50,
      totalRevenue: Math.floor(Math.random() * 50000) + 1000,
      successRate: 98.5,
      volumeData: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 1000)
      }))
    };
  },

  processPayment: async (gatewayId, paymentData) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const success = Math.random() > 0.1;
    
    if (success) {
      return { 
        success: true, 
        transactionId: `txn_${uuidv4()}`, 
        status: 'completed',
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error('Payment processing failed');
    }
  },

  getGatewayHealth: () => {
    const gateways = getStoredGateways();
    const total = gateways.length;
    const healthy = gateways.filter(g => g.health === 'healthy').length;
    const error = gateways.filter(g => g.health === 'error').length;
    
    return {
      status: error > 0 ? 'warning' : 'healthy',
      details: `${healthy}/${total} gateways operational`
    };
  }
};
