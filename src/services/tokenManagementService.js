
/**
 * Service for managing authentication tokens securely.
 * In a production environment, sensitive tokens should be handled server-side.
 * For this frontend-only prototype, we use localStorage with basic obfuscation.
 */

const TOKENS_KEY = 'munal_integration_tokens';

// Simple mock encryption (Base64) - NOT for production use
const mockEncrypt = (text) => {
  try {
    return btoa(text);
  } catch (e) {
    console.error('Encryption failed', e);
    return text;
  }
};

const mockDecrypt = (encoded) => {
  try {
    return atob(encoded);
  } catch (e) {
    console.error('Decryption failed', e);
    return encoded;
  }
};

const getTokens = () => {
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveTokens = (tokens) => {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
};

export const tokenManagementService = {
  storeToken: (serviceName, tokenData) => {
    const tokens = getTokens();
    
    // Calculate expiration if expiresIn provided
    let expiresAt = null;
    if (tokenData.expiresIn) {
      expiresAt = new Date().getTime() + (tokenData.expiresIn * 1000);
    }

    tokens[serviceName] = {
      accessToken: mockEncrypt(tokenData.accessToken),
      refreshToken: tokenData.refreshToken ? mockEncrypt(tokenData.refreshToken) : null,
      expiresAt: expiresAt,
      scope: tokenData.scope || '',
      updatedAt: new Date().toISOString()
    };

    saveTokens(tokens);
  },

  getToken: (serviceName) => {
    const tokens = getTokens();
    const tokenData = tokens[serviceName];

    if (!tokenData) return null;

    // Check expiration
    if (tokenData.expiresAt && new Date().getTime() > tokenData.expiresAt) {
      // In a real app, this would trigger a refresh flow
      console.warn(`Token for ${serviceName} has expired`);
      return null; 
    }

    return {
      ...tokenData,
      accessToken: mockDecrypt(tokenData.accessToken),
      refreshToken: tokenData.refreshToken ? mockDecrypt(tokenData.refreshToken) : null
    };
  },

  removeToken: (serviceName) => {
    const tokens = getTokens();
    delete tokens[serviceName];
    saveTokens(tokens);
  },

  hasValidToken: (serviceName) => {
    const token = tokenManagementService.getToken(serviceName);
    return !!token;
  },

  // Mock refresh logic
  refreshToken: async (serviceName) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const tokens = getTokens();
    const current = tokens[serviceName];
    
    if (!current || !current.refreshToken) {
      throw new Error('No refresh token available');
    }

    // Generate new mock token
    const newToken = {
      accessToken: `mock_refreshed_token_${Date.now()}`,
      refreshToken: current.refreshToken, // Usually rotates, but keeping simple
      expiresIn: 3600
    };

    tokenManagementService.storeToken(serviceName, newToken);
    return newToken;
  }
};
