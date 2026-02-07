import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { springs } from '../../theme/animations';
import { useEffect } from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'muted';
export type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  count?: number;
  maxCount?: number;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  showZero?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  animated?: boolean;
}

export function Badge({
  count = 0,
  maxCount = 99,
  variant = 'default',
  size = 'medium',
  dot = false,
  showZero = false,
  style,
  textStyle,
  animated = true,
}: BadgeProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (animated && count > 0) {
      scale.value = withSequence(
        withSpring(1.2, springs.bouncy),
        withSpring(1, springs.gentle)
      );
    }
  }, [count, animated, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!dot && count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  const badgeStyles = getBadgeStyles(variant, size, dot, displayCount.length);

  if (dot) {
    return (
      <Animated.View style={[badgeStyles.container, animatedStyle, style]} />
    );
  }

  return (
    <Animated.View style={[badgeStyles.container, animatedStyle, style]}>
      <Text style={[badgeStyles.text, textStyle]}>{displayCount}</Text>
    </Animated.View>
  );
}

interface BadgeStyles {
  container: ViewStyle;
  text: TextStyle;
}

function getBadgeStyles(
  variant: BadgeVariant,
  size: BadgeSize,
  dot: boolean,
  textLength: number
): BadgeStyles {
  const colorMap: Record<BadgeVariant, string> = {
    default: colors.rose,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    muted: colors.muted,
  };

  const sizeMap: Record<BadgeSize, { height: number; minWidth: number; fontSize: number; padding: number }> = {
    small: { height: 16, minWidth: 16, fontSize: 10, padding: 4 },
    medium: { height: 20, minWidth: 20, fontSize: 12, padding: 6 },
    large: { height: 24, minWidth: 24, fontSize: 14, padding: 8 },
  };

  const dotSizeMap: Record<BadgeSize, number> = {
    small: 6,
    medium: 8,
    large: 10,
  };

  const sizeConfig = sizeMap[size];
  const backgroundColor = colorMap[variant];

  if (dot) {
    const dotSize = dotSizeMap[size];
    return {
      container: {
        width: dotSize,
        height: dotSize,
        borderRadius: dotSize / 2,
        backgroundColor,
      },
      text: {},
    };
  }

  const extraWidth = textLength > 1 ? (textLength - 1) * sizeConfig.fontSize * 0.5 : 0;

  return {
    container: {
      height: sizeConfig.height,
      minWidth: sizeConfig.minWidth + extraWidth,
      paddingHorizontal: sizeConfig.padding,
      borderRadius: sizeConfig.height / 2,
      backgroundColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize: sizeConfig.fontSize,
      fontWeight: '600',
      color: colors.textInverse,
      textAlign: 'center',
    },
  };
}

const styles = StyleSheet.create({});
