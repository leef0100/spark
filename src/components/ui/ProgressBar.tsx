import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { borderRadius as themeRadius } from '../../theme/spacing';
import { springs } from '../../theme/animations';

export type ProgressBarVariant = 'default' | 'success' | 'warning' | 'error';
export type ProgressBarSize = 'small' | 'medium' | 'large';

interface ProgressBarProps {
  progress: number; // 0 to 1
  variant?: ProgressBarVariant;
  size?: ProgressBarSize;
  animated?: boolean;
  showBackground?: boolean;
  borderRadius?: number;
  style?: ViewStyle;
}

const sizeMap: Record<ProgressBarSize, number> = {
  small: 4,
  medium: 8,
  large: 12,
};

const colorMap: Record<ProgressBarVariant, string> = {
  default: colors.rose,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
};

export function ProgressBar({
  progress,
  variant = 'default',
  size = 'medium',
  animated = true,
  showBackground = true,
  borderRadius,
  style,
}: ProgressBarProps) {
  const animatedProgress = useSharedValue(0);
  const height = sizeMap[size];
  const radius = borderRadius ?? height / 2;
  const fillColor = colorMap[variant];

  useEffect(() => {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    if (animated) {
      animatedProgress.value = withSpring(clampedProgress, springs.gentle);
    } else {
      animatedProgress.value = clampedProgress;
    }
  }, [progress, animated, animatedProgress]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }));

  return (
    <View
      style={[
        styles.container,
        {
          height,
          borderRadius: radius,
          backgroundColor: showBackground ? colors.lightGray : 'transparent',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            borderRadius: radius,
            backgroundColor: fillColor,
          },
          animatedFillStyle,
        ]}
      />
    </View>
  );
}

// Segmented progress bar for multi-step flows
interface SegmentedProgressBarProps {
  currentStep: number;
  totalSteps: number;
  variant?: ProgressBarVariant;
  size?: ProgressBarSize;
  gap?: number;
  style?: ViewStyle;
}

export function SegmentedProgressBar({
  currentStep,
  totalSteps,
  variant = 'default',
  size = 'medium',
  gap = 4,
  style,
}: SegmentedProgressBarProps) {
  const height = sizeMap[size];
  const fillColor = colorMap[variant];

  return (
    <View style={[styles.segmentedContainer, { gap }, style]}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <View
            key={index}
            style={[
              styles.segment,
              {
                height,
                borderRadius: height / 2,
                backgroundColor: isCompleted || isCurrent ? fillColor : colors.lightGray,
                opacity: isCurrent ? 0.6 : 1,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  segmentedContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  segment: {
    flex: 1,
  },
});
