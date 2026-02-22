import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { userDataSyncService } from '@/services/userDataSyncService';

const AuthContext = createContext(null);

const USERS_KEY = 'munal_users';
const SESSIONS_KEY = 'munal_sessions';

// Helper to simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
      // 1. Check User Session
      try {
        const sessionJson = localStorage.getItem(SESSIONS_KEY);
        if (sessionJson) {
          const session = JSON.parse(sessionJson);
          const sessionAge = new Date() - new Date(session.createdAt);
          if (sessionAge > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(SESSIONS_KEY);
          } else {
            const usersJson = localStorage.getItem(USERS_KEY);
            const users = usersJson ? JSON.parse(usersJson) : [];
            const foundUser = users.find(u => u.id === session.userId);
            
            if (foundUser) {
              // Check if user is suspended
              if (foundUser.status === 'Suspended' || foundUser.status === 'suspended') {
                 localStorage.removeItem(SESSIONS_KEY);
                 setUser(null);
                 setIsAuthenticated(false);
              } else {
                setUser(foundUser);
                setIsAuthenticated(true);
              }
            } else {
              localStorage.removeItem(SESSIONS_KEY);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load user session", err);
        localStorage.removeItem(SESSIONS_KEY);
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  // --- Regular User Functions ---
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      await delay(800);

      const usersJson = localStorage.getItem(USERS_KEY);
      const users = usersJson ? JSON.parse(usersJson) : [];
      const foundUser = users.find(u => u.email === email && u.password === password);

      if (!foundUser) throw new Error("Invalid email or password");
      
      if (foundUser.status === 'Suspended' || foundUser.status === 'suspended') {
        throw new Error("Your account has been suspended. Please contact support.");
      }

      const session = { 
        userId: foundUser.id, 
        token: uuidv4(), 
        createdAt: new Date().toISOString() 
      };
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(session));
      setUser(foundUser);
      setIsAuthenticated(true);
      return { success: true, user: foundUser };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, name) => {
    try {
      setLoading(true);
      setError(null);
      await delay(800);

      const usersJson = localStorage.getItem(USERS_KEY);
      const users = usersJson ? JSON.parse(usersJson) : [];
      if (users.some(u => u.email === email)) throw new Error("Email already registered");

      const newUser = { 
        id: uuidv4(), 
        email, 
        password, 
        name: name,
        full_name: name, // Ensure both exist for compatibility
        plan: 'Free', 
        status: 'Active',
        avatar: null,
        joinedDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        role: 'User'
      };
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      // Notify sync service
      userDataSyncService.notifyChange('create', newUser.id, newUser);

      const session = { 
        userId: newUser.id, 
        token: uuidv4(), 
        createdAt: new Date().toISOString() 
      };
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(session));
      setUser(newUser);
      setIsAuthenticated(true);
      return { success: true, user: newUser };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await delay(300);
      localStorage.removeItem(SESSIONS_KEY);
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
      const usersJson = localStorage.getItem(USERS_KEY);
      let users = usersJson ? JSON.parse(usersJson) : [];
      const userIndex = users.findIndex(u => u.id === user.id);
      if (userIndex === -1) throw new Error("User not found");
      
      const updatedUser = { ...users[userIndex], ...updates };
      users[userIndex] = updatedUser;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      // Notify sync service
      userDataSyncService.notifyChange('update', user.id, updatedUser);
      
      setUser(updatedUser);
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
      await delay(500);
      if (!user) throw new Error("No user logged in");
      
      const usersJson = localStorage.getItem(USERS_KEY);
      let users = usersJson ? JSON.parse(usersJson) : [];
      const userIndex = users.findIndex(u => u.id === user.id);
      
      if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return { success: true };
      }
      return { success: false, error: "User not found" };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }

  const value = {
    user,
    isAuthenticated,
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