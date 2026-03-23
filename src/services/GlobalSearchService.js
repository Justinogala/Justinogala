
import { getApiUrl } from '@/lib/api';

const SEARCH_HISTORY_KEY = 'munal_search_history';

// App navigation items for instant search
const NAV_ITEMS = [
  { id: 'nav-dashboard', title: 'Dashboard', path: '/dashboard', type: 'page', icon: 'layout-dashboard' },
  { id: 'nav-workspaces', title: 'Workspaces', path: '/workspaces', type: 'page', icon: 'briefcase' },
  { id: 'nav-calendar', title: 'Calendar', path: '/calendar', type: 'page', icon: 'calendar' },
  { id: 'nav-messages', title: 'Messages', path: '/messages', type: 'page', icon: 'message-square' },
  { id: 'nav-chat', title: 'Chat', path: '/workspace/chat', type: 'page', icon: 'message-circle' },
  { id: 'nav-meetings', title: 'Meetings', path: '/meetings', type: 'page', icon: 'video' },
  { id: 'nav-transcriptions', title: 'Transcriptions', path: '/transcriptions', type: 'page', icon: 'file-text' },
  { id: 'nav-reports', title: 'Reports', path: '/reports', type: 'page', icon: 'bar-chart-3' },
  { id: 'nav-approvals', title: 'Approvals', path: '/approvals', type: 'page', icon: 'check-circle' },
  { id: 'nav-esignature', title: 'eSignature', path: '/e-signature', type: 'page', icon: 'pen-tool' },
  { id: 'nav-settings', title: 'Settings', path: '/settings', type: 'page', icon: 'settings' },
  { id: 'nav-profile', title: 'Profile', path: '/profile', type: 'page', icon: 'user' },
  { id: 'nav-shifts', title: 'Shift Management', path: '/shift-management', type: 'page', icon: 'clock' },
  { id: 'nav-voice', title: 'Voice Chat', path: '/voice-chat', type: 'page', icon: 'mic' },
  { id: 'nav-ai', title: 'AI Assistant', path: '/ai-chat', type: 'page', icon: 'sparkles' },
];

export const GlobalSearchService = {
  search: async (query, userId) => {
    if (!query || query.trim().length < 1) {
      return { pages: [], workspaces: [], users: [], forms: [], messages: [] };
    }

    const normalizedQuery = query.toLowerCase().trim();
    const results = {
      pages: [],
      workspaces: [],
      users: [],
      forms: [],
      messages: [],
    };

    // 1. Instant: Search navigation items (no network)
    results.pages = NAV_ITEMS.filter(item =>
      item.title.toLowerCase().includes(normalizedQuery)
    ).slice(0, 4);

    // 2. Backend search across collections
    try {
      const apiUrl = getApiUrl();
      const params = new URLSearchParams({ q: query.trim(), limit: '5' });
      if (userId) params.append('user_id', userId);

      const res = await fetch(`${apiUrl}/api/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        results.workspaces = data.workspaces || [];
        results.users = data.users || [];
        results.forms = data.forms || [];
        results.messages = data.messages || [];
      }
    } catch (error) {
      console.error('Backend search failed:', error);
    }

    return results;
  },

  getRecentSearches: () => {
    try {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (e) {
      return [];
    }
  },

  addRecentSearch: (term) => {
    if (!term || !term.trim()) return;
    try {
      const history = GlobalSearchService.getRecentSearches();
      const newHistory = [
        { term: term.trim(), timestamp: new Date().toISOString() },
        ...history.filter(item => item.term.toLowerCase() !== term.trim().toLowerCase())
      ].slice(0, 10);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    } catch (e) {
      console.error('Failed to save search history', e);
    }
  },

  clearHistory: () => {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  }
};
