import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PUBLIC_PREFIXES = [
  '/', '/login', '/signup', '/forgot-password', '/verify-email',
  '/admin-login', '/pricing', '/features', '/use-cases',
  '/resources', '/downloads', '/company', '/product',
  '/legal', '/contact', '/privacy', '/terms', '/security',
  '/manage-cookies', '/trademarks', '/about', '/careers',
  '/press', '/roadmap', '/blog', '/community',
  '/documentation', '/api-reference', '/chrome-extension',
  '/desktop-app', '/mobile-app',
];

function isPublicRoute(pathname) {
  if (pathname === '/') return true;
  return PUBLIC_PREFIXES.some(
    (p) => p !== '/' && (pathname === p || pathname.startsWith(p + '/'))
  );
}

export function useSourceProtection() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isPublicRoute(pathname)) return;

    const blockContext = (e) => e.preventDefault();
    const blockKeys = (e) => {
      if (e.ctrlKey && e.key === 'u') e.preventDefault();
      if (e.ctrlKey && e.shiftKey && /^[ijcIJC]$/.test(e.key)) e.preventDefault();
      if (e.key === 'F12') e.preventDefault();
      if (e.ctrlKey && e.key === 's') e.preventDefault();
    };

    document.addEventListener('contextmenu', blockContext);
    document.addEventListener('keydown', blockKeys);

    return () => {
      document.removeEventListener('contextmenu', blockContext);
      document.removeEventListener('keydown', blockKeys);
    };
  }, [pathname]);
}
