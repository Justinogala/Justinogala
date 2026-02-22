
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { transcriptionConfigService } from '@/services/transcriptionConfigService';
import { API_CONFIG } from '@/config/apiConfig';

export const APIKeyManagementContext = createContext(null);

export const APIKeyManagementProvider = ({ children }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [validationStatus, setValidationStatus] = useState('idle'); // idle, validating, valid, invalid

  // Load key on mount
  useEffect(() => {
    const loadKey = () => {
      try {
        // 1. Try to get key from user settings
        let storedKey = transcriptionConfigService.getOpenAIApiKey();
        
        // 2. Fallback to env var if not in settings
        if (!storedKey) {
          storedKey = API_CONFIG.OPENAI_API_KEY;
        }

        if (storedKey) {
          setApiKey(storedKey);
          // Basic validation check on load
          const looksValid = storedKey.startsWith('sk-') && storedKey.length > 20;
          setIsValid(looksValid);
          setValidationStatus(looksValid ? 'valid' : 'invalid');
        } else {
          setIsValid(false);
          setValidationStatus('idle');
        }
      } catch (error) {
        console.error("Error loading API key:", error);
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };
    loadKey();
  }, []);

  const validateKey = useCallback(async (keyToTest) => {
    setValidationStatus('validating');
    try {
      // OpenAI keys typically start with sk-
      if (!keyToTest || !keyToTest.startsWith('sk-') || keyToTest.length < 20) {
        throw new Error("Invalid OpenAI API Key format");
      }

      // In a real app, we might make a lightweight call to models endpoint
      // For now, format validation is acceptable for frontend check
      
      setValidationStatus('valid');
      setIsValid(true);
      return true;
    } catch (error) {
      setValidationStatus('invalid');
      setIsValid(false);
      return false;
    }
  }, []);

  const saveKey = useCallback(async (newKey) => {
    try {
      if (!newKey.startsWith('sk-')) {
        throw new Error("Invalid key format");
      }
      transcriptionConfigService.saveAPIKey('openai', newKey);
      setApiKey(newKey);
      setIsValid(true);
      setValidationStatus('valid');
      return true;
    } catch (error) {
      console.error("Failed to save API key", error);
      setValidationStatus('invalid');
      return false;
    }
  }, []);

  const removeKey = useCallback(() => {
    transcriptionConfigService.saveAPIKey('openai', ''); 
    transcriptionConfigService.toggleProvider('openai', false);
    setApiKey('');
    setIsValid(false);
    setValidationStatus('idle');
  }, []);

  const value = {
    apiKey,
    isValid,
    isLoading,
    validationStatus,
    saveKey,
    removeKey,
    validateKey
  };

  return (
    <APIKeyManagementContext.Provider value={value}>
      {children}
    </APIKeyManagementContext.Provider>
  );
};
