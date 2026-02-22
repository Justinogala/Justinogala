
const BRANDING_KEY = 'munal_branding_settings';

const DEFAULT_BRANDING = {
  brandName: 'Munal',
  brandDescription: 'AI-Powered Meeting Assistant',
  colors: {
    primary: '#6366f1', // Indigo 500
    secondary: '#ec4899', // Pink 500
    accent: '#06b6d4', // Cyan 500
    background: '#ffffff',
    text: '#0f172a'
  },
  typography: {
    fontFamily: 'Inter',
    headingFont: 'Inter',
    baseSize: '16px'
  },
  borderRadius: '0.5rem'
};

const getBranding = () => {
  try {
    const stored = localStorage.getItem(BRANDING_KEY);
    return stored ? { ...DEFAULT_BRANDING, ...JSON.parse(stored) } : DEFAULT_BRANDING;
  } catch {
    return DEFAULT_BRANDING;
  }
};

const saveBranding = (settings) => {
  localStorage.setItem(BRANDING_KEY, JSON.stringify(settings));
  // Dispatch event for live updates if needed
  window.dispatchEvent(new Event('branding-updated'));
};

export const brandingService = {
  getSettings: () => getBranding(),

  updateSettings: (updates) => {
    const current = getBranding();
    const newSettings = { ...current, ...updates };
    saveBranding(newSettings);
    return newSettings;
  },

  updateColors: (colors) => {
    const current = getBranding();
    const newSettings = { 
      ...current, 
      colors: { ...current.colors, ...colors } 
    };
    saveBranding(newSettings);
    return newSettings;
  },

  updateTypography: (typography) => {
    const current = getBranding();
    const newSettings = { 
      ...current, 
      typography: { ...current.typography, ...typography } 
    };
    saveBranding(newSettings);
    return newSettings;
  },

  resetSettings: () => {
    saveBranding(DEFAULT_BRANDING);
    return DEFAULT_BRANDING;
  }
};
