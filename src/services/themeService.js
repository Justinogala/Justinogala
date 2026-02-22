
import { v4 as uuidv4 } from 'uuid';

const THEMES_KEY = 'munal_custom_themes';
const ACTIVE_THEME_KEY = 'munal_active_theme_id';

const DEFAULT_THEMES = [
  {
    id: 'default',
    name: 'Default Light',
    type: 'light',
    colors: {
      primary: '#6366f1',
      secondary: '#ec4899',
      background: '#ffffff',
      surface: '#f8fafc'
    }
  },
  {
    id: 'dark',
    name: 'Default Dark',
    type: 'dark',
    colors: {
      primary: '#818cf8',
      secondary: '#f472b6',
      background: '#0f172a',
      surface: '#1e293b'
    }
  }
];

const getCustomThemes = () => {
  try {
    return JSON.parse(localStorage.getItem(THEMES_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveCustomThemes = (themes) => {
  localStorage.setItem(THEMES_KEY, JSON.stringify(themes));
};

export const themeService = {
  getAllThemes: () => {
    return [...DEFAULT_THEMES, ...getCustomThemes()];
  },

  createTheme: (name, colors, type = 'light') => {
    const themes = getCustomThemes();
    const newTheme = {
      id: uuidv4(),
      name,
      type,
      colors,
      createdAt: new Date().toISOString()
    };
    themes.push(newTheme);
    saveCustomThemes(themes);
    return newTheme;
  },

  updateTheme: (id, updates) => {
    const themes = getCustomThemes();
    const index = themes.findIndex(t => t.id === id);
    
    if (index === -1) {
      // Cannot update default themes in this implementation
      if (DEFAULT_THEMES.some(t => t.id === id)) {
        throw new Error("Cannot modify default themes");
      }
      throw new Error("Theme not found");
    }

    themes[index] = { ...themes[index], ...updates };
    saveCustomThemes(themes);
    return themes[index];
  },

  deleteTheme: (id) => {
    const themes = getCustomThemes();
    const filtered = themes.filter(t => t.id !== id);
    saveCustomThemes(filtered);
    
    // If deleted theme was active, revert to default
    if (localStorage.getItem(ACTIVE_THEME_KEY) === id) {
      themeService.applyTheme('default');
    }
  },

  applyTheme: (id) => {
    const all = [...DEFAULT_THEMES, ...getCustomThemes()];
    const theme = all.find(t => t.id === id);
    
    if (theme) {
      localStorage.setItem(ACTIVE_THEME_KEY, id);
      
      // Apply CSS variables
      const root = document.documentElement;
      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--theme-${key}`, value);
      });
      
      // Handle dark mode class
      if (theme.type === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      return true;
    }
    return false;
  },

  getActiveThemeId: () => {
    return localStorage.getItem(ACTIVE_THEME_KEY) || 'default';
  }
};
