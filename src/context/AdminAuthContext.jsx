/**
 * AdminAuthContext - Backward-compatible wrapper
 * All auth logic is now consolidated in AuthContext.jsx
 * This file re-exports admin auth hooks for existing component imports
 */
export { AuthProvider as AdminAuthProvider, useAdminAuth } from './AuthContext';
