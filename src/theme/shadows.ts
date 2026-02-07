import { Platform, ViewStyle } from 'react-native';

// Soft, warm shadows - no harsh black drops
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ViewStyle,

  xs: Platform.select({
    ios: {
      shadowColor: '#1A1A1A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
    } as ViewStyle,
    android: {
      elevation: 1,
    } as ViewStyle,
    default: {
      shadowColor: '#1A1A1A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
    } as ViewStyle,
  }),

  sm: Platform.select({
    ios: {
      shadowColor: '#1A1A1A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    } as ViewStyle,
    android: {
      elevation: 2,
    } as ViewStyle,
    default: {
      shadowColor: '#1A1A1A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    } as ViewStyle,
  }),

  md: Platform.select({
    ios: {
      shadowColor: '#1A1A1A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    } as ViewStyle,
    android: {
      elevation: 4,
    } as ViewStyle,
    default: {
      shadowColor: '#1A1A1A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    } as ViewStyle,
  }),

  lg: Platform.select({
    ios: {
      shadowColor: '#1A1A1A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    } as ViewStyle,
    android: {
      elevation: 8,
    } as ViewStyle,
    default: {
      shadowColor: '#1A1A1A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    } as ViewStyle,
  }),

  xl: Platform.select({
    ios: {
      shadowColor: '#1A1A1A',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    } as ViewStyle,
    android: {
      elevation: 12,
    } as ViewStyle,
    default: {
      shadowColor: '#1A1A1A',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    } as ViewStyle,
  }),

  // Special warm shadow for cards
  card: Platform.select({
    ios: {
      shadowColor: '#D4626E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    } as ViewStyle,
    android: {
      elevation: 4,
    } as ViewStyle,
    default: {
      shadowColor: '#D4626E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    } as ViewStyle,
  }),
} as const;

export type ShadowName = keyof typeof shadows;
