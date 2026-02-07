import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { springs, animationValues } from '../../theme/animations';

export type CardVariant = 'elevated' | 'flat' | 'outlined';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  padding?: keyof typeof spacing;
  style?: ViewStyle;
  animated?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
  children,
  variant = 'elevated',
  onPress,
  padding = 'md',
  style,
  animated = true,
}: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress && animated) {
      scale.value = withSpring(animationValues.pressedScale, springs.snappy);
    }
  };

  const handlePressOut = () => {
    if (onPress && animated) {
      scale.value = withSpring(1, springs.gentle);
    }
  };

  const cardStyles = getCardStyles(variant, padding);

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[cardStyles, animatedStyle, style]}
        accessibilityRole="button"
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={[cardStyles, style]}>{children}</View>;
}

function getCardStyles(
  variant: CardVariant,
  padding: keyof typeof spacing
): ViewStyle {
  const baseStyles: ViewStyle = {
    borderRadius: borderRadius.lg,
    padding: spacing[padding],
    overflow: 'hidden',
  };

  const variantStyles: Record<CardVariant, ViewStyle> = {
    elevated: {
      backgroundColor: colors.surface,
      ...shadows.md,
    },
    flat: {
      backgroundColor: colors.cream,
    },
    outlined: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
  };

  return {
    ...baseStyles,
    ...variantStyles[variant],
  };
}

const styles = StyleSheet.create({});
