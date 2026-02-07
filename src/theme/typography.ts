import { Platform, TextStyle } from 'react-native';

// Font families
// Using system fonts with fallbacks - can be replaced with custom fonts later
export const fonts = {
  // Serif display font for headings (Playfair Display style)
  display: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia',
  }),
  // Sans-serif for body text (DM Sans style)
  body: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),
  // Monospace for special cases
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
} as const;

// Font weights
export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Typography scale
export const typography = {
  // Display headings - Serif font
  h1: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.5,
  } as TextStyle,

  h2: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.3,
  } as TextStyle,

  h3: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: fontWeights.semibold,
    letterSpacing: -0.2,
  } as TextStyle,

  h4: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0,
  } as TextStyle,

  // Body text - Sans-serif font
  bodyLarge: {
    fontFamily: fonts.body,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: fontWeights.regular,
    letterSpacing: 0,
  } as TextStyle,

  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.regular,
    letterSpacing: 0,
  } as TextStyle,

  bodySmall: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.regular,
    letterSpacing: 0,
  } as TextStyle,

  // Caption and labels
  caption: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.regular,
    letterSpacing: 0.2,
  } as TextStyle,

  label: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.1,
  } as TextStyle,

  labelSmall: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,

  // Button text
  button: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.5,
  } as TextStyle,

  buttonSmall: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.3,
  } as TextStyle,
} as const;

export type TypographyVariant = keyof typeof typography;
