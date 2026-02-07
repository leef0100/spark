export * from './colors';
export * from './typography';
export * from './spacing';
export * from './shadows';
export * from './animations';

import { colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, layout } from './spacing';
import { shadows } from './shadows';
import { springs, timing, animationValues } from './animations';

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  layout,
  shadows,
  springs,
  timing,
  animationValues,
} as const;

export type Theme = typeof theme;
