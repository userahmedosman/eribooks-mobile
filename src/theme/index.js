/**
 * EriBooks Mobile Theme
 * Design tokens for a premium dark-mode book reading app
 */

export const colors = {
  // Primary brand colors
  primary: '#6C63FF',
  primaryLight: '#8B83FF',
  primaryDark: '#4B44CC',

  // Accent
  accent: '#FF6B6B',
  accentLight: '#FF8E8E',

  // Backgrounds
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252540',
  card: '#1E1E35',

  // Text
  text: '#FFFFFF',
  textSecondary: '#A0A0B8',
  textMuted: '#6B6B80',

  // Semantic
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#EF4444',
  info: '#38BDF8',

  // Borders
  border: '#2A2A45',
  borderLight: '#3A3A55',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',

  // White with opacity
  white10: 'rgba(255,255,255,0.1)',
  white20: 'rgba(255,255,255,0.2)',
  white50: 'rgba(255,255,255,0.5)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  label: { fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  button: { fontSize: 16, fontWeight: '600' },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
  },
  lg: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export default { colors, spacing, borderRadius, typography, shadows };
