export const colors = {
  // Primary palette
  ivory: '#FFFBF5',
  charcoal: '#1A1A1A',
  rose: '#D4626E',
  coral: '#E07A5F',

  // Neutrals
  cream: '#F5F0EB',
  muted: '#8C8C8C',
  lightGray: '#E5E5E5',
  mediumGray: '#B3B3B3',
  darkGray: '#4A4A4A',

  // Semantic
  success: '#4CAF79',
  error: '#D44E4E',
  warning: '#E9A74A',
  info: '#5B9BD5',

  // Transparent variants
  overlay: 'rgba(26, 26, 26, 0.5)',
  overlayLight: 'rgba(26, 26, 26, 0.3)',
  roseLight: 'rgba(212, 98, 110, 0.1)',
  roseMedium: 'rgba(212, 98, 110, 0.2)',

  // Background variants
  background: '#FFFBF5',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text variants
  textPrimary: '#1A1A1A',
  textSecondary: '#4A4A4A',
  textMuted: '#8C8C8C',
  textInverse: '#FFFFFF',

  // Border
  border: '#E5E5E5',
  borderFocused: '#D4626E',
} as const;

export type ColorName = keyof typeof colors;

// Dark mode colors (for future implementation)
export const darkColors = {
  ...colors,
  ivory: '#1A1A1A',
  charcoal: '#FFFBF5',
  cream: '#2A2A2A',
  background: '#121212',
  surface: '#1E1E1E',
  surfaceElevated: '#2A2A2A',
  textPrimary: '#FFFBF5',
  textSecondary: '#B3B3B3',
  textMuted: '#8C8C8C',
  border: '#3A3A3A',
  overlay: 'rgba(0, 0, 0, 0.7)',
} as const;
