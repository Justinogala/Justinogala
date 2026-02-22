
import { v4 as uuidv4 } from 'uuid';

const DOMAINS_KEY = 'munal_custom_domains';

const getDomains = () => {
  try {
    return JSON.parse(localStorage.getItem(DOMAINS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveDomains = (domains) => {
  localStorage.setItem(DOMAINS_KEY, JSON.stringify(domains));
};

export const domainService = {
  getDomains: () => getDomains(),

  addDomain: (domainName) => {
    const domains = getDomains();
    
    if (domains.some(d => d.domain === domainName)) {
      throw new Error("Domain already exists");
    }

    const newDomain = {
      id: uuidv4(),
      domain: domainName,
      status: 'pending_verification', // pending_verification, verified, failed
      dnsRecord: {
        type: 'TXT',
        host: '@',
        value: `munal-verify=${uuidv4().substring(0, 18)}`
      },
      createdAt: new Date().toISOString(),
      verifiedAt: null
    };

    domains.push(newDomain);
    saveDomains(domains);
    return newDomain;
  },

  verifyDomain: async (id) => {
    // Mock verification process
    const domains = getDomains();
    const index = domains.findIndex(d => d.id === id);
    
    if (index === -1) throw new Error("Domain not found");

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock success chance
    const success = Math.random() > 0.1;
    
    domains[index].status = success ? 'verified' : 'failed';
    if (success) domains[index].verifiedAt = new Date().toISOString();
    
    saveDomains(domains);
    
    if (!success) throw new Error("DNS verification failed. Please check your records.");
    return domains[index];
  },

  deleteDomain: (id) => {
    const domains = getDomains();
    const filtered = domains.filter(d => d.id !== id);
    saveDomains(filtered);
  }
};
