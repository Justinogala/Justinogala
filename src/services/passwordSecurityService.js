
import bcrypt from 'bcryptjs';

const PASSWORD_HISTORY_KEY = 'munal_password_history';

const getPasswordHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(PASSWORD_HISTORY_KEY) || '{}');
  } catch {
    return {};
  }
};

export const passwordSecurityService = {
  validateStrength: (password) => {
    const checks = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
    };

    const passedCount = Object.values(checks).filter(Boolean).length;
    let strength = 'weak';
    if (passedCount >= 5) strength = 'strong';
    else if (passedCount >= 4) strength = 'good';
    else if (passedCount >= 3) strength = 'fair';

    return { isValid: passedCount === 5, strength, checks };
  },

  hashPassword: async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  },

  comparePassword: async (password, hash) => {
    return await bcrypt.compare(password, hash);
  },

  generatePassword: (length = 16) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    // Ensure it meets criteria (simple check, if fails, regenerate recursively)
    const { isValid } = passwordSecurityService.validateStrength(retVal);
    if (!isValid && length >= 12) return passwordSecurityService.generatePassword(length);
    return retVal;
  },

  checkHistory: async (userId, newPassword) => {
    const history = getPasswordHistory();
    const userHistory = history[userId] || [];
    
    // Check against last 5 passwords
    for (const entry of userHistory) {
      const match = await bcrypt.compare(newPassword, entry.hash);
      if (match) return false; // Password found in history
    }
    return true;
  },

  addToHistory: async (userId, passwordHash) => {
    const history = getPasswordHistory();
    if (!history[userId]) history[userId] = [];
    
    history[userId].unshift({
      hash: passwordHash,
      createdAt: new Date().toISOString()
    });
    
    // Keep only last 5
    if (history[userId].length > 5) history[userId] = history[userId].slice(0, 5);
    
    localStorage.setItem(PASSWORD_HISTORY_KEY, JSON.stringify(history));
  }
};
