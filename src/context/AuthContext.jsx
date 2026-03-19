import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { userDataSyncService } from '@/services/userDataSyncService';

import { getApiUrl, API_URL } from '@/lib/api';

const AuthContext = createContext(null);

const SESSIONS_KEY = 'munal_sessions';
const AUTH_KEY = 'munal_auth';
const REFRESH_KEY = 'munal_refresh';
const LAST_ACTIVITY_KEY = 'munal_last_activity';
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const AuthProvider = ({ children }) => {
  // Regular User State
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync with admin changes
  useEffect(() => {
    const handleSync = (e) => {
      const { action, userId, data } = e.detail;
      
      // If the current logged-in user is updated by admin, reflect changes
      if (user && user.id === userId) {
        if (action === 'update') {
          setUser(prev => ({ ...prev, ...data }));
        } else if (action === 'delete' || (action === 'update' && data.status === 'Suspended')) {
          // Auto logout if deleted or suspended
          logout();
        }
      }
    };

    const unsubscribe = userDataSyncService.subscribe(handleSync);
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for existing session
      try {
        const sessionJson = localStorage.getItem(SESSIONS_KEY);
        const authUserJson = localStorage.getItem(AUTH_KEY);
        
        if (sessionJson && authUserJson) {
          const session = JSON.parse(sessionJson);
          const sessionAge = new Date() - new Date(session.createdAt);
          
          // Session expires after 24 hours
          if (sessionAge > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(SESSIONS_KEY);
            localStorage.removeItem(AUTH_KEY);
          } else {
            const foundUser = JSON.parse(authUserJson);
            
            // Check if user is suspended
            if (foundUser.status === 'Suspended' || foundUser.status === 'suspended') {
              localStorage.removeItem(SESSIONS_KEY);
              localStorage.removeItem(AUTH_KEY);
              setUser(null);
              setIsAuthenticated(false);
            } else {
              setUser(foundUser);
              setIsAuthenticated(true);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load user session", err);
        localStorage.removeItem(SESSIONS_KEY);
        localStorage.removeItem(AUTH_KEY);
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  // ---- Inactivity auto-logout (30 min) ----
  useEffect(() => {
    if (!isAuthenticated) return;

    const trackActivity = () => localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, trackActivity, { passive: true }));
    trackActivity();

    const interval = setInterval(() => {
      const last = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
      if (Date.now() - last > INACTIVITY_TIMEOUT) {
        localStorage.removeItem(SESSIONS_KEY);
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        window.location.href = '/';
      }
    }, 60_000); // check every minute

    return () => {
      events.forEach(e => window.removeEventListener(e, trackActivity));
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // ---- Token refresh (refresh 2 min before expiry) ----
  useEffect(() => {
    if (!isAuthenticated) return;
    const refreshInterval = setInterval(async () => {
      const refreshToken = localStorage.getItem(REFRESH_KEY);
      if (!refreshToken) return;
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (res.ok) {
          const data = await res.json();
          const session = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
          session.token = data.token;
          session.createdAt = new Date().toISOString();
          localStorage.setItem(SESSIONS_KEY, JSON.stringify(session));
          if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
        }
      } catch { /* silent */ }
    }, 22 * 60 * 1000); // refresh every 22 hours (before 24h expiry)
    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  

  // Safe JSON parser that handles non-JSON responses
  const safeParseJSON = async (response) => {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Unable to connect to the server. Please try again later.');
    }
  };

  // --- Regular User Functions ---
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await safeParseJSON(response);

      if (!response.ok) {
        throw new Error(data.detail || "Invalid email or password");
      }

      const foundUser = data.user;
      const session = { 
        userId: foundUser.id, 
        token: data.token, 
        createdAt: new Date().toISOString() 
      };
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(session));
      localStorage.setItem(AUTH_KEY, JSON.stringify(foundUser));
      if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      setUser(foundUser);
      setIsAuthenticated(true);
      return { success: true, user: foundUser };
    } catch (err) {
      const msg = err.message || 'Login failed. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, name) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });

      const data = await safeParseJSON(response);

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      const newUser = data.user;
      userDataSyncService.notifyChange('create', newUser.id, newUser);

      const session = { 
        userId: newUser.id, 
        token: data.token || uuidv4(), 
        createdAt: new Date().toISOString() 
      };
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(session));
      localStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
      if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      setUser(newUser);
      setIsAuthenticated(true);
      return { success: true, user: newUser };
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await delay(300);
      localStorage.removeItem(SESSIONS_KEY);
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    await delay(500);
    return { success: true, message: "If account exists, password reset email sent." };
  };
  
  const sendOTP = async (email) => {
    await delay(500);
    console.log(`OTP sent to ${email}`);
    return { success: true, message: "OTP sent to your email." };
  };

  const verifyOTP = async (email, otp) => {
    await delay(800);
    if (otp === '123456') {
       const usersJson = localStorage.getItem(USERS_KEY);
       const users = usersJson ? JSON.parse(usersJson) : [];
       const foundUser = users.find(u => u.email === email);
       
       if (foundUser) {
         const session = { 
           userId: foundUser.id, 
           token: uuidv4(), 
           createdAt: new Date().toISOString() 
         };
         localStorage.setItem(SESSIONS_KEY, JSON.stringify(session));
         setUser(foundUser);
         setIsAuthenticated(true);
         return { success: true, user: foundUser };
       } else {
         return { success: false, error: "User not found" };
       }
    }
    return { success: false, error: "Invalid OTP" };
  };

  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const data = await safeParseJSON(response);
      if (!response.ok) throw new Error(data.detail || 'Failed to update profile');
      
      const updatedUser = data.user || data;
      userDataSyncService.notifyChange('update', user.id, updatedUser);
      setUser(prev => ({ ...prev, ...updatedUser }));
      localStorage.setItem(AUTH_KEY, JSON.stringify({ ...user, ...updatedUser }));
      return { success: true, user: updatedUser };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      setLoading(true);
      if (!user) throw new Error("No user logged in");
      
      const response = await fetch(`${API_URL}/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      
      const data = await safeParseJSON(response);
      if (!response.ok) throw new Error(data.detail || 'Failed to update password');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }

  const value = {
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    loading,
    error,
    login,
    signup,
    logout,
    resetPassword,
    updateProfile,
    sendOTP,
    verifyOTP,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;