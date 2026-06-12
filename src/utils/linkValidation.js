
/**
 * Utility to validate navigation paths against known routes.
 * This helps ensure that hardcoded links in components match the defined routes in App.jsx.
 */

const VALID_ROUTES = [
  // Public
  '/',
  '/contact',
  '/features',
  '/features/overview',
  '/features/meetings',
  '/features/transcriptions',
  '/features/search',
  '/features/chat-messaging',
  '/features/teams',
  '/features/file-management',
  '/features/analytics',
  '/features/voice-chat',
  '/features/calendar-integration',
  '/login',
  '/login/otp',
  '/signup',
  '/password-reset',
  '/pricing',
  '/product/pricing',
  '/product/security',
  '/product/roadmap',
  '/use-cases',
  '/use-cases/sales',
  '/use-cases/customer-success',
  '/use-cases/product',
  '/use-cases/engineering',
  '/use-cases/hr',
  '/resources',
  '/resources/docs',
  '/resources/api',
  '/resources/blog',
  '/resources/community',
  '/downloads',
  '/downloads/chrome-extension',
  '/downloads/desktop-app',
  '/downloads/mobile-app',
  '/company/about',
  '/company/careers',
  '/company/press',
  '/legal/privacy',
  '/legal/terms',
  '/legal/contact',

  // Protected User
  '/dashboard',
  '/user/dashboard',
  '/meetings',
  '/calendar',
  '/my-meetings',
  '/transcriptions',
  '/transcription/new',
  '/transcriptions/manage',
  '/transcribe-new',
  '/summarize',
  '/voice-chat',
  '/video-call',
  '/files',
  '/workspaces',
  '/workspace/chat',
  '/workspace/video-conferencing',
  '/billing',
  '/user/payment-methods',
  '/user/payment-history',
  '/user/checkout',
  '/support',
  '/support-tickets',
  '/messages',
  '/chat-messages',
  '/recent-chats',
  '/integrations',
  '/integrations/settings',
  '/settings/api',
  '/settings/api-keys',
  '/profile',
  '/settings',
  '/help',
  '/settings/billing',
  '/my-workspaces',
  '/analytics',
  '/update-password',

  // Admin
  '/admin/login',
  '/admin',
  '/admin/dashboard',
  '/admin/users',
  '/admin/settings',
  '/admin/analytics',
  '/admin/reports',
  '/admin/billing',
  '/admin/workspaces',
  '/admin/profile',
  '/admin/content',
  '/admin/health',
  '/admin/tickets',
  '/admin/support-tickets',
  '/admin/messages',
  '/admin/api-settings',
  '/admin/integrations',
  '/admin/payment-gateways',
  '/admin/transcription-settings',
  '/admin/api-logs',
  '/admin/integration-logs',
  '/admin/debug-settings'
];

/**
 * Checks if a path is valid.
 * Handles dynamic parameters like /meeting/:id by checking the base path or specific patterns.
 * @param {string} path 
 * @returns {boolean}
 */
export const isValidRoute = (path) => {
  if (!path) return false;
  
  // Direct match
  if (VALID_ROUTES.includes(path)) return true;

  // Dynamic route patterns
  const dynamicPatterns = [
    /^\/meeting\/[\w-]+$/,
    /^\/meeting\/[\w-]+\/live$/,
    /^\/shared\/[\w-]+$/,
    /^\/checkout\/[\w-]+$/,
    /^\/workspace\/[\w-]+$/,
    /^\/workspace\/[\w-]+\/manage$/,
    /^\/workspace\/[\w-]+\/call\/[\w-]+$/,
    /^\/transcriptions\/[\w-]+$/,
    /^\/support-tickets\/[\w-]+$/
  ];

  return dynamicPatterns.some(pattern => pattern.test(path));
};

/**
 * Validates a list of links and returns invalid ones.
 * @param {Array<{label: string, path: string}>} links 
 * @returns {Array<{label: string, path: string}>}
 */
export const validateLinks = (links) => {
  return links.filter(link => !isValidRoute(link.path));
};

export const getRouteFor = (name) => {
    // Helper to get routes by simplified name if needed
    // Not exhaustive, just for critical paths
    const map = {
        'dashboard': '/dashboard',
        'login': '/login',
        'signup': '/signup',
        'pricing': '/pricing',
        'contact': '/contact'
    };
    return map[name] || '/';
};
