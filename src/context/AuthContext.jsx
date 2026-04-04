import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { userDataSyncService } from '@/services/userDataSyncService';
import { getApiUrl, API_URL } from '@/lib/api';
import { registerDeviceWithBackend } from '@/utils/native';

const AuthContext = createContext(null);

// Storage keys
const SESSIONS_KEY = 'munal_sessions';
const AUTH_KEY = 'munal_auth';
const REFRESH_KEY = 'munal_refresh';
const LAST_ACTIVITY_KEY = 'munal_last_activity';
const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_USER_KEY = 'admin_user';
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Safe JSON parser
const safeParseJSON = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Unable to connect to the server. Please try again later.');
  }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const AuthProvider = ({ children }) => {
  // --- Regular User State ---
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Admin State ---
  const [adminUser, setAdminUser] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [adminError, setAdminError] = useState(null);

  // ==================== USER AUTH ====================

  // Sync with admin changes
  useEffect(() => {
    const handleSync = (e) => {
      const { action, userId, data } = e.detail;
      if (user && user.id === userId) {
        if (action === 'update') {
          setUser(prev => ({ ...prev, ...data }));
        } else if (action === 'delete' || (action === 'update' && data.status === 'Suspended')) {
          userLogout();
        }
      }
    };
    const unsubscribe = userDataSyncService.subscribe(handleSync);
    return () => unsubscribe();
  }, [user]);

  // Initialize user session
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const sessionJson = localStorage.getItem(SESSIONS_KEY);
        const authUserJson = localStorage.getItem(AUTH_KEY);
        const refreshToken = localStorage.getItem(REFRESH_KEY);

        if (sessionJson && authUserJson) {
          const session = JSON.parse(sessionJson);
          const sessionAge = new Date() - new Date(session.createdAt);

          if (sessionAge > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(SESSIONS_KEY);
            localStorage.removeItem(AUTH_KEY);
          } else {
            const foundUser = JSON.parse(authUserJson);
            if (foundUser.status === 'Suspended' || foundUser.status === 'suspended') {
              localStorage.removeItem(SESSIONS_KEY);
              localStorage.removeItem(AUTH_KEY);
            } else {
              // Validate refresh token (checks 2FA 24h window on backend)
              if (refreshToken) {
                try {
                  const res = await fetch(`${API_URL}/api/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    session.token = data.token;
                    session.createdAt = new Date().toISOString();
                    localStorage.setItem(SESSIONS_KEY, JSON.stringify(session));
                    if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
                    setUser(foundUser);
                    setIsAuthenticated(true);
                  } else {
                    const errData = await res.json().catch(() => ({}));
                    if (errData.detail === '2fa_session_expired') {
                      // 2FA session expired — clear and require re-login
                      localStorage.removeItem(SESSIONS_KEY);
                      localStorage.removeItem(AUTH_KEY);
                      localStorage.removeItem(REFRESH_KEY);
                      localStorage.removeItem(LAST_ACTIVITY_KEY);
                    } else {
                      // Other refresh error — still allow cached session
                      setUser(foundUser);
                      setIsAuthenticated(true);
                    }
                  }
                } catch {
                  // Network error — allow cached session
                  setUser(foundUser);
                  setIsAuthenticated(true);
                }
              } else {
                setUser(foundUser);
                setIsAuthenticated(true);
              }
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

  // Inactivity auto-logout
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
    }, 60_000);

    return () => {
      events.forEach(e => window.removeEventListener(e, trackActivity));
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Token refresh
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
        } else {
          // Check if 2FA session expired — force re-login
          const errData = await res.json().catch(() => ({}));
          if (errData.detail === '2fa_session_expired') {
            localStorage.removeItem(SESSIONS_KEY);
            localStorage.removeItem(AUTH_KEY);
            localStorage.removeItem(REFRESH_KEY);
            localStorage.removeItem(LAST_ACTIVITY_KEY);
            setUser(null);
            setIsAuthenticated(false);
            window.location.href = '/login';
          }
        }
      } catch { /* silent */ }
    }, 22 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

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
      if (!response.ok) throw new Error(data.detail || "Invalid email or password");

      // Handle 2FA requirement
      if (data.requires_2fa) {
        return {
          success: false,
          requires_2fa: true,
          two_factor_method: data.two_factor_method,
          user_id: data.user_id,
          user: data.user,
          email,
          password,
        };
      }

      const foundUser = data.user;
      const session = { userId: foundUser.id, token: data.token, createdAt: new Date().toISOString() };
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(session));
      localStorage.setItem(AUTH_KEY, JSON.stringify(foundUser));
      if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      setUser(foundUser);
      setIsAuthenticated(true);
      // Register native device for push notifications
      registerDeviceWithBackend(foundUser.id, API_URL);
      return { success: true, user: foundUser };
    } catch (err) {
      const msg = err.message || 'Login failed. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const loginWithSkip2FA = async (email, password) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/auth/login?skip_2fa=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await safeParseJSON(response);
      if (!response.ok) throw new Error(data.detail || "Login failed");
      const foundUser = data.user;
      const session = { userId: foundUser.id, token: data.token, createdAt: new Date().toISOString() };
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(session));
      localStorage.setItem(AUTH_KEY, JSON.stringify(foundUser));
      if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      setUser(foundUser);
      setIsAuthenticated(true);
      return { success: true, user: foundUser };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, name, inviteToken = null) => {
    try {
      setLoading(true);
      setError(null);
      const url = inviteToken
        ? `${API_URL}/api/auth/register?invite_token=${encodeURIComponent(inviteToken)}`
        : `${API_URL}/api/auth/register`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      const data = await safeParseJSON(response);
      if (!response.ok) throw new Error(data.detail || "Registration failed");

      const newUser = data.user;
      userDataSyncService.notifyChange('create', newUser.id, newUser);
      const session = { userId: newUser.id, token: data.token || uuidv4(), createdAt: new Date().toISOString() };
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

  const userLogout = async () => {
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
    return { success: true, message: "OTP sent to your email." };
  };

  const verifyOTP = async (email, otp) => {
    await delay(800);
    if (otp === '123456') {
      const usersJson = localStorage.getItem('munal_users');
      const users = usersJson ? JSON.parse(usersJson) : [];
      const foundUser = users.find(u => u.email === email);
      if (foundUser) {
        const session = { userId: foundUser.id, token: uuidv4(), createdAt: new Date().toISOString() };
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(session));
        setUser(foundUser);
        setIsAuthenticated(true);
        return { success: true, user: foundUser };
      }
      return { success: false, error: "User not found" };
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
  };

  // ==================== ADMIN AUTH ====================

  // Initialize admin session
  useEffect(() => {
    try {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      const userStr = localStorage.getItem(ADMIN_USER_KEY);
      if (token && userStr) {
        setAdminUser(JSON.parse(userStr));
        setIsAdminAuthenticated(true);
      }
    } catch (err) {
      console.error('Admin Auth Restoration Error:', err);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  const adminLogin = async (email, password, skip2fa = false) => {
    setAdminLoading(true);
    setAdminError(null);
    try {
      const apiUrl = getApiUrl();
      const url = skip2fa ? `${apiUrl}/api/auth/login?skip_2fa=true` : `${apiUrl}/api/auth/login`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await safeParseJSON(response);
      if (!response.ok) throw new Error(data.detail || 'Invalid email or password');

      // Handle 2FA requirement
      if (data.requires_2fa && !skip2fa) {
        setAdminLoading(false);
        return {
          success: false,
          requires_2fa: true,
          user_id: data.user_id,
          two_factor_method: data.two_factor_method,
        };
      }

      const dbUser = data.user;
      const role = (dbUser.role || '').toLowerCase().replace(' ', '_');
      if (role !== 'admin' && role !== 'super_admin' && role !== 'manager') {
        throw new Error('Access denied. Admin privileges required.');
      }

      const adminObj = {
        id: dbUser.id,
        email: dbUser.email,
        username: dbUser.name || dbUser.full_name || 'Admin',
        name: dbUser.name || dbUser.full_name || 'Admin',
        role: dbUser.role,
        module_permissions: dbUser.module_permissions || {},
        organization_id: dbUser.organization_id || null,
        org_name: dbUser.org_name || null,
        org_role: dbUser.org_role || null,
        plan: dbUser.plan,
        avatar: dbUser.avatar
      };

      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminObj));
      setAdminUser(adminObj);
      setIsAdminAuthenticated(true);
      return { success: true };
    } catch (err) {
      setAdminError(err.message);
      return { success: false, error: err.message };
    } finally {
      setAdminLoading(false);
    }
  };

  const refreshPermissions = async () => {
    if (!adminUser?.id) return;
    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      const res = await fetch(`${apiUrl}/api/admin/module-permissions/user/${adminUser.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const updated = { ...adminUser, module_permissions: data.permissions };
        setAdminUser(updated);
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Failed to refresh permissions:', err);
    }
  };

  const isSuperAdmin = () => {
    const role = (adminUser?.role || '').toLowerCase().replace(' ', '_');
    return role === 'super_admin';
  };

  const hasModuleAccess = (moduleKey) => {
    if (isSuperAdmin()) return true;
    return adminUser?.module_permissions?.[moduleKey] === true;
  };

  const adminLogout = async () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    setAdminUser(null);
    setIsAdminAuthenticated(false);
    return { success: true };
  };

  const clearAdminError = () => setAdminError(null);

  // ==================== CONTEXT VALUE ====================

  const value = {
    // User auth
    user, setUser, isAuthenticated, setIsAuthenticated, loading, error,
    login, loginWithSkip2FA, signup, logout: userLogout, resetPassword, updateProfile,
    sendOTP, verifyOTP, updatePassword,
    // Admin auth
    adminUser, isAdminAuthenticated, adminLoading, adminError,
    adminLogin, adminLogout, clearAdminError,
    isSuperAdmin, hasModuleAccess, refreshPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// Admin hook — returns admin-scoped view of the same context
export const useAdminAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAdminAuth must be used within an AuthProvider');
  return {
    adminUser: context.adminUser,
    isAuthenticated: context.isAdminAuthenticated,
    loading: context.adminLoading,
    error: context.adminError,
    login: context.adminLogin,
    logout: context.adminLogout,
    clearError: context.clearAdminError,
    isSuperAdmin: context.isSuperAdmin,
    hasModuleAccess: context.hasModuleAccess,
    refreshPermissions: context.refreshPermissions,
  };
};

export default AuthContext;
