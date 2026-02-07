// 4px base unit spacing system
const BASE_UNIT = 4;

export const spacing = {
  none: 0,
  xxs: BASE_UNIT * 0.5,  // 2
  xs: BASE_UNIT,          // 4
  sm: BASE_UNIT * 2,      // 8
  md: BASE_UNIT * 4,      // 16
  lg: BASE_UNIT * 6,      // 24
  xl: BASE_UNIT * 8,      // 32
  xxl: BASE_UNIT * 12,    // 48
  xxxl: BASE_UNIT * 16,   // 64
} as const;

export type SpacingName = keyof typeof spacing;

// Border radius
export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export type BorderRadiusName = keyof typeof borderRadius;

// Layout constants
export const layout = {
  screenPaddingHorizontal: spacing.md,
  screenPaddingTop: spacing.lg,
  screenPaddingBottom: spacing.xl,
  cardPadding: spacing.md,
  inputHeight: 56,
  buttonHeight: 52,
  buttonHeightSmall: 40,
  tabBarHeight: 80,
  headerHeight: 56,
  avatarSizeSmall: 32,
  avatarSizeMedium: 48,
  avatarSizeLarge: 72,
  avatarSizeXLarge: 120,
  photoAspectRatio: 4 / 5, // Standard portrait ratio
} as const;
