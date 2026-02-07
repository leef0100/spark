import { Easing } from 'react-native-reanimated';

// Spring animation presets
export const springs = {
  // Gentle, smooth spring for most UI elements
  gentle: {
    damping: 20,
    stiffness: 150,
    mass: 1,
  },

  // Bouncy spring for playful interactions
  bouncy: {
    damping: 10,
    stiffness: 200,
    mass: 0.8,
  },

  // Snappy spring for quick, responsive feedback
  snappy: {
    damping: 15,
    stiffness: 400,
    mass: 0.5,
  },

  // Soft spring for subtle, slow movements
  soft: {
    damping: 25,
    stiffness: 100,
    mass: 1.2,
  },

  // Stiff spring for instant feedback
  stiff: {
    damping: 20,
    stiffness: 500,
    mass: 0.5,
  },
} as const;

// Timing animation presets
export const timing = {
  // Quick feedback
  fast: {
    duration: 150,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },

  // Standard transitions
  normal: {
    duration: 250,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },

  // Slow, dramatic transitions
  slow: {
    duration: 400,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },

  // Ease in for exits
  easeIn: {
    duration: 200,
    easing: Easing.bezier(0.42, 0, 1, 1),
  },

  // Ease out for entrances
  easeOut: {
    duration: 200,
    easing: Easing.bezier(0, 0, 0.58, 1),
  },

  // Ease in-out for symmetric animations
  easeInOut: {
    duration: 300,
    easing: Easing.bezier(0.42, 0, 0.58, 1),
  },
} as const;

// Animation values
export const animationValues = {
  // Scale values
  pressedScale: 0.97,
  activeScale: 1.02,

  // Opacity values
  pressedOpacity: 0.8,
  disabledOpacity: 0.5,

  // Duration constants (ms)
  microInteraction: 100,
  shortAnimation: 200,
  mediumAnimation: 300,
  longAnimation: 500,
} as const;

export type SpringName = keyof typeof springs;
export type TimingName = keyof typeof timing;
