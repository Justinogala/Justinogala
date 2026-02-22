import { useContext } from 'react';
import AuthContext from '@/context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Return the context value directly which includes:
  // user, isAuthenticated, loading, error
  // login, signup, logout, resetPassword, verifyOTP, sendOTP, updateProfile, updatePassword
  return context;
};