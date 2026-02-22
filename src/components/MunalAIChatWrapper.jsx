import React from 'react';
import { useLocation } from 'react-router-dom';
import MunalAIChatContainer from './MunalAIChatContainer';

const MunalAIChatWrapper = () => {
  const location = useLocation();
  const path = location.pathname;

  // Define exclusion rules
  // Exclude admin pages
  const isAdmin = path.startsWith('/admin');
  
  // Exclude auth pages (login, signup, etc)
  const isAuth = ['/login', '/signup', '/password-reset', '/otp'].some(p => path.startsWith(p));
  
  // Exclude specific user settings/billing pages if desired, but prompt says "user account portal routes".
  // Let's interpret "user account portal" as deep settings pages where chat might obscure content.
  // Prompt explicitly mentions: /settings, /profile, /billing, /workspace
  const isUserPortal = ['/settings', '/profile', '/billing', '/workspace'].some(p => path.startsWith(p));

  // Determine visibility
  // Show on landing page, dashboard, features pages, etc.
  const shouldShow = !isAdmin && !isAuth && !isUserPortal;

  if (!shouldShow) return null;

  return <MunalAIChatContainer />;
};

export default MunalAIChatWrapper;