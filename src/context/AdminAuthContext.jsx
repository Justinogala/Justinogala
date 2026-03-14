
import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext(null);

const API_URL = import.meta.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_API_URL || '';
const getApiUrl = () => API_URL || window.location.origin;

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

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      let data;
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch {
        throw new Error('Unable to connect to the server. Please try again later.');
      }

      if (!response.ok) {
        throw new Error(data.detail || 'Invalid email or password');
      }

      const dbUser = data.user;
      const role = (dbUser.role || '').toLowerCase();
      
      if (role !== 'admin' && role !== 'super_admin' && role !== 'manager') {
        throw new Error('Access denied. Admin privileges required.');
      }

      const user = {
        id: dbUser.id,
        email: dbUser.email,
        username: dbUser.name || dbUser.full_name || 'Admin',
        name: dbUser.name || dbUser.full_name || 'Admin',
        role: dbUser.role,
        permissions: dbUser.permissions || {},
        plan: dbUser.plan,
        avatar: dbUser.avatar
      };

      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

      setAdminUser(user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setAdminUser(null);
    setIsAuthenticated(false);
    return { success: true };
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
