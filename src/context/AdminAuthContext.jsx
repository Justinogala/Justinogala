
import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext(null);

// Hardcoded credentials for the task
const ADMIN_CREDENTIALS = {
  email: 'admin@munal.com',
  password: 'Admin@123456'
};

const STORAGE_KEYS = {
  TOKEN: 'admin_token',
  USER: 'admin_user'
};

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for existing session on mount
    const initAuth = () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const userStr = localStorage.getItem(STORAGE_KEYS.USER);
        
        if (token && userStr) {
          setAdminUser(JSON.parse(userStr));
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Admin Auth Restoration Error:', err);
        // Clear potentially corrupted data
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        const user = {
          id: 'admin-1',
          email: email,
          username: 'Admin',
          role: 'super_admin'
        };
        const token = 'mock-admin-token-' + Date.now();

        // Persist session
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

        setAdminUser(user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      setAdminUser(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (err) {
      console.error('Logout error', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AdminAuthContext.Provider 
      value={{ 
        adminUser, 
        isAuthenticated, 
        loading, 
        error, 
        login, 
        logout,
        clearError 
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
