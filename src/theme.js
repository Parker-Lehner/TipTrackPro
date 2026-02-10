// TipTrack Pro Design System
// Inspired by Apple Fitness + Mint + Notion

const theme = {
  colors: {
    // Primary palette
    primary: '#6366f1',        // Indigo
    primaryLight: '#818cf8',
    primaryDark: '#4f46e5',
    primaryMuted: 'rgba(99, 102, 241, 0.15)',
    
    // Accent colors
    accent: '#14b8a6',         // Teal
    accentLight: '#2dd4bf',
    accentMuted: 'rgba(20, 184, 166, 0.15)',
    
    // Success/Warning/Error
    success: '#22c55e',
    successMuted: 'rgba(34, 197, 94, 0.15)',
    warning: '#f59e0b',
    warningMuted: 'rgba(245, 158, 11, 0.15)',
    error: '#ef4444',
    errorMuted: 'rgba(239, 68, 68, 0.15)',
    
    // Backgrounds
    background: '#0f0f23',
    backgroundSecondary: '#1a1a2e',
    cardBackground: '#16213e',
    cardBackgroundLight: '#1e2a4a',
    
    // Text
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    
    // Borders
    border: '#334155',
    borderLight: '#475569',
    
    // Gradients
    gradientPrimary: ['#6366f1', '#8b5cf6', '#a855f7'],
    gradientAccent: ['#14b8a6', '#06b6d4', '#0ea5e9'],
    gradientDark: ['#0f0f23', '#1a1a2e', '#16213e'],
    gradientCard: ['#1e2a4a', '#16213e'],
    gradientSuccess: ['#22c55e', '#16a34a'],
    gradientWarning: ['#f59e0b', '#d97706'],
  },
  
  typography: {
    sizes: {
      hero: 48,
      h1: 32,
      h2: 24,
      h3: 20,
      body: 16,
      bodySmall: 14,
      caption: 12,
      xs: 10,
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      heavy: '800',
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: {
      shadowColor: '#6366f1',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 10,
    },
  },
  
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
};

export default theme;