// Centralized API URL resolution
// Always uses window.location.origin at runtime so it works on any domain
// (preview, production, custom domain, etc.)

export function getApiUrl() {
  // In browser: use current origin (works for both preview and production)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for SSR/testing
  return import.meta.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_API_URL || '';
}

export const API_URL = getApiUrl();
