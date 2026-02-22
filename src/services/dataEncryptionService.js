
import { v4 as uuidv4 } from 'uuid';

const KEYS_STORAGE_KEY = 'munal_encryption_keys';
// Note: Storing keys in localStorage is not secure for production. 
// This is for demonstration within a frontend-only environment.

const getStoredKeys = () => {
  try {
    return JSON.parse(localStorage.getItem(KEYS_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveKeys = (keys) => {
  localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
};

// Helper to convert ArrayBuffer to Base64 string
const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Helper to convert Base64 string to ArrayBuffer
const base64ToArrayBuffer = (base64) => {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};

export const dataEncryptionService = {
  /**
   * Generates a new AES-GCM encryption key
   */
  generateKey: async () => {
    const key = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["encrypt", "decrypt"]
    );

    // Export key to store it
    const exportedKey = await window.crypto.subtle.exportKey("jwk", key);
    
    const keyMeta = {
      keyId: uuidv4(),
      algorithm: 'AES-GCM-256',
      keyData: exportedKey,
      createdAt: new Date().toISOString(),
      active: true
    };

    // Archive old keys if any
    const keys = getStoredKeys();
    keys.forEach(k => k.active = false);
    keys.push(keyMeta);
    saveKeys(keys);

    return keyMeta;
  },

  getActiveKey: async () => {
    const keys = getStoredKeys();
    const activeKeyMeta = keys.find(k => k.active) || keys[keys.length - 1]; // Fallback to last
    
    if (!activeKeyMeta) {
      return await dataEncryptionService.generateKey();
    }
    
    return activeKeyMeta;
  },

  /**
   * Encrypts string data
   * @param {string} data - Plain text data
   * @returns {Promise<Object>} - { encryptedData, iv, keyId }
   */
  encryptData: async (data) => {
    const keyMeta = await dataEncryptionService.getActiveKey();
    
    // Import key back from JWK
    const key = await window.crypto.subtle.importKey(
      "jwk",
      keyMeta.keyData,
      { name: "AES-GCM" },
      true,
      ["encrypt"]
    );

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      encodedData
    );

    return {
      encryptedData: arrayBufferToBase64(encryptedBuffer),
      iv: arrayBufferToBase64(iv),
      keyId: keyMeta.keyId,
      algorithm: keyMeta.algorithm
    };
  },

  /**
   * Decrypts data
   * @param {string} encryptedDataBase64 
   * @param {string} ivBase64 
   * @param {string} keyId 
   */
  decryptData: async (encryptedDataBase64, ivBase64, keyId) => {
    const keys = getStoredKeys();
    const keyMeta = keys.find(k => k.keyId === keyId);
    
    if (!keyMeta) throw new Error(`Decryption key ${keyId} not found`);

    const key = await window.crypto.subtle.importKey(
      "jwk",
      keyMeta.keyData,
      { name: "AES-GCM" },
      true,
      ["decrypt"]
    );

    const encryptedData = base64ToArrayBuffer(encryptedDataBase64);
    const iv = base64ToArrayBuffer(ivBase64);

    try {
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        key,
        encryptedData
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (e) {
      console.error("Decryption failed", e);
      return null;
    }
  },

  rotateKey: async () => {
    // Generate new key (logic inside generateKey handles archiving old ones)
    return await dataEncryptionService.generateKey();
  }
};
