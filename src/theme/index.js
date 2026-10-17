/**
 * EriBooks Mobile Theme
 * Design tokens for a modern, elegant book reading app
 * Aligned with EriBooks official brand identity (Royal Blue & Gold)
 * Supports refined Light and Dark modes
 */

export const getColors = (theme = 'dark') => {
  const isDark = theme === 'dark';
  
  return {
    // Brand Colors (Aligned with EriBooks Web & Official Logo)
    primary: isDark ? '#4d62cd' : '#3f52b8',
    primaryLight: isDark ? '#7389ea' : '#5b6edb',
    primaryDark: isDark ? '#324194' : '#2c387f',

    // Official Gold Accents (for VIP, Badges, Highlights)
    gold: '#ceb434',
    goldLight: '#edd182',
    goldDark: '#90721d',
    goldGlow: isDark ? 'rgba(206, 180, 52, 0.15)' : 'rgba(206, 180, 52, 0.25)',

    // Backgrounds (Sophisticated midnight tone for dark mode)
    background: isDark ? '#0b0d17' : '#f8fafc',
    surface: isDark ? '#121626' : '#ffffff',
    surfaceLight: isDark ? '#1a2035' : '#f1f5f9',
    card: isDark ? '#131728' : '#ffffff',
    cardHighlight: isDark ? '#1c223a' : '#f8fafd',

    // Text (Refined Slate / Zinc hierarchy)
    text: isDark ? '#f8fafc' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    textMuted: isDark ? '#64748b' : '#94a3b8',

    // Semantic
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#38bdf8',

    // Borders & Dividers
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    borderLight: isDark ? 'rgba(255, 255, 255, 0.14)' : '#edf2f7',
    borderGold: isDark ? 'rgba(206, 180, 52, 0.35)' : 'rgba(206, 180, 52, 0.45)',

    // Overlays & Translucencies
    overlay: isDark ? 'rgba(11, 13, 23, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    white10: 'rgba(255, 255, 255, 0.1)',
    white20: 'rgba(255, 255, 255, 0.2)',
    black10: 'rgba(0, 0, 0, 0.1)',
    black30: 'rgba(0, 0, 0, 0.3)',
    primaryTranslucent: isDark ? 'rgba(77, 98, 205, 0.16)' : 'rgba(63, 82, 184, 0.12)',
  };
};

export const colors = getColors('dark');

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
};

export const borderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  h3: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '600', lineHeight: 15, letterSpacing: 0.2 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  button: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color = '#4d62cd') => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  }),
};

export default { colors, getColors, spacing, borderRadius, typography, shadows };
