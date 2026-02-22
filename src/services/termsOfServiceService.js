
const TERMS_KEY = 'munal_terms_of_service';

const DEFAULT_TERMS = {
  id: 'tos_v1',
  version: '1.0.0',
  content: 'Default Terms of Service content...',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const getStoredTerms = () => {
  try {
    const terms = JSON.parse(localStorage.getItem(TERMS_KEY) || '[]');
    if (terms.length === 0) return [DEFAULT_TERMS];
    return terms;
  } catch {
    return [DEFAULT_TERMS];
  }
};

export const termsOfServiceService = {
  getTermsOfService: () => {
    const terms = getStoredTerms();
    return terms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  },

  updateTermsOfService: (newContent, version) => {
    const terms = getStoredTerms();
    const newTerm = {
      id: `tos_${version.replace(/\./g, '_')}`,
      version,
      content: newContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    terms.push(newTerm);
    localStorage.setItem(TERMS_KEY, JSON.stringify(terms));
    return newTerm;
  },

  getTermsVersion: (version) => {
    const terms = getStoredTerms();
    return terms.find(t => t.version === version);
  },

  getTermsHistory: () => {
    return getStoredTerms().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};
