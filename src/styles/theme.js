
export const PURPLE_THEME = {
  // Primary Gradient Colors
  primary: '#7C3AED', // Violet 600
  primaryGradientStart: '#6D28D9', // Violet 700
  primaryGradientEnd: '#7C3AED',   // Violet 600
  
  // Secondary / Lighter shades
  secondary: '#8B5CF6', // Violet 500
  tertiary: '#A78BFA', // Violet 400
  light: '#EDE9FE',    // Violet 50
  
  // Darker / Interaction states
  dark: '#5B21B6',     // Violet 800
  hover: '#5B21B6',
  active: '#4C1D95',   // Violet 900
  
  // Semantic Colors
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F8FAFC', // Slate 50
  textPrimary: '#0F172A', // Slate 900 (High contrast dark)
  textSecondary: '#475569', // Slate 600 (Medium contrast)
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#E2E8F0',
};

export const LIGHT_THEME = {
  ...PURPLE_THEME,
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F8FAFC',
  textPrimary: '#0F172A', // Slate 900
  textSecondary: '#334155', // Slate 700 - Darker for better readability
};

export const DARK_THEME = {
  ...PURPLE_THEME,
  bgPrimary: '#0F172A', // Slate 900
  bgSecondary: '#1E1B4B', // Indigo 950
  textPrimary: '#F8FAFC', // Slate 50
  textSecondary: '#94A3B8', // Slate 400
  border: '#1E293B', // Slate 800
  primaryGradientStart: '#7C3AED', 
  primaryGradientEnd: '#8B5CF6',
};

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};
