/**
 * EriBooks Mobile Theme
 * Design tokens for a premium book reading app
 * Supports Light and Dark modes
 */

export const getColors = (theme = 'dark') => {
  const isDark = theme === 'dark';
  
  return {
    // Primary brand colors (aligned with web)
    primary: isDark ? '#6366f1' : '#4f46e5',
    primaryLight: isDark ? '#818cf8' : '#6366f1',
    primaryDark: isDark ? '#4338ca' : '#3730a3',

    // Backgrounds (Pure Black for dark mode)
    background: isDark ? '#000000' : '#ffffff',
    surface: isDark ? '#0a0a0a' : '#ffffff',
    surfaceLight: isDark ? '#18181b' : '#f4f4f5',
    card: isDark ? '#0a0a0a' : '#ffffff',

    // Text (Zinc scale for premium feel)
    text: isDark ? '#fafafa' : '#09090b',
    textSecondary: isDark ? '#a1a1aa' : '#71717a',
    textMuted: isDark ? '#52525b' : '#a1a1aa',

    // Semantic
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',

    // Borders
    border: isDark ? '#1f1f1f' : '#e4e4e7',
    borderLight: isDark ? '#27272a' : '#f4f4f5',

    // Overlay
    overlay: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',

    // Helper colors
    white10: 'rgba(255,255,255,0.1)',
    black10: 'rgba(0,0,0,0.1)',
  };
};

export const colors = getColors('dark');

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 20,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  h2: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  h3: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  label: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  button: { fontSize: 16, fontWeight: '700' },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
};

export default { colors, getColors, spacing, borderRadius, typography, shadows };
