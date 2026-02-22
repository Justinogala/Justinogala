
import * as OTPAuth from 'otpauth';

const TFA_STORAGE_KEY = 'munal_2fa_settings';

const getStoredSettings = () => {
  try {
    return JSON.parse(localStorage.getItem(TFA_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveSettings = (settings) => {
  localStorage.setItem(TFA_STORAGE_KEY, JSON.stringify(settings));
};

export const twoFactorAuthService = {
  /**
   * Generates a new 2FA secret and OTPAuth URL
   * @param {string} userId - The user's ID
   * @param {string} email - The user's email (for the authenticator label)
   * @returns {Object} { secret, otpauth_url }
   */
  generateSecret: (userId, email) => {
    // Generate a random secret
    const secret = new OTPAuth.Secret({ size: 20 });
    
    // Create TOTP object to get the URL
    const totp = new OTPAuth.TOTP({
      issuer: 'Munal',
      label: email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret
    });

    return {
      secret: secret.base32,
      otpauth_url: totp.toString()
    };
  },

  /**
   * Verifies a 2FA token against the secret
   * @param {string} token - The 6-digit code
   * @param {string} secretBase32 - The secret in base32 format
   * @returns {boolean} isValid
   */
  verifyCode: (token, secretBase32) => {
    if (!token || !secretBase32) return false;

    const totp = new OTPAuth.TOTP({
      issuer: 'Munal',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secretBase32)
    });

    // delta returns the number of windows the token is valid for (0 = current)
    // We allow a window of 1 (30 seconds before/after) for drift
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  },

  /**
   * Generates backup codes
   * @param {number} count - Number of codes to generate
   * @returns {Array<string>} Array of backup codes
   */
  generateBackupCodes: (count = 10) => {
    const codes = [];
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Base32-like chars, no I, O, 0, 1 for clarity
    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      codes.push(code);
    }
    return codes;
  },

  /**
   * Enables 2FA for a user
   * @param {string} userId 
   * @param {string} secret 
   * @returns {Object} The saved settings
   */
  enableTwoFactor: (userId, secret) => {
    const settings = getStoredSettings();
    const backupCodes = twoFactorAuthService.generateBackupCodes();
    
    settings[userId] = {
      userId,
      secret,
      backupCodes: backupCodes.map(code => ({ code, used: false })),
      enabled: true,
      createdAt: new Date().toISOString()
    };
    
    saveSettings(settings);
    return { success: true, backupCodes };
  },

  /**
   * Disables 2FA for a user
   * @param {string} userId 
   */
  disableTwoFactor: (userId) => {
    const settings = getStoredSettings();
    if (settings[userId]) {
      settings[userId].enabled = false;
      delete settings[userId].secret;
      delete settings[userId].backupCodes;
      saveSettings(settings);
    }
    return { success: true };
  },

  /**
   * Checks if 2FA is enabled for a user
   * @param {string} userId 
   */
  isTwoFactorEnabled: (userId) => {
    const settings = getStoredSettings();
    return settings[userId]?.enabled || false;
  },

  /**
   * Validates a backup code and marks it as used
   * @param {string} userId 
   * @param {string} code 
   */
  validateBackupCode: (userId, code) => {
    const settings = getStoredSettings();
    const userSettings = settings[userId];

    if (!userSettings || !userSettings.enabled) return false;

    const codeIndex = userSettings.backupCodes.findIndex(
      bc => bc.code === code.toUpperCase() && !bc.used
    );

    if (codeIndex !== -1) {
      userSettings.backupCodes[codeIndex].used = true;
      saveSettings(settings);
      return true;
    }

    return false;
  }
};
