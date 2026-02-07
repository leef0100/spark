import React, { useCallback } from 'react';
import { StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { springs, animationValues } from '../../theme/animations';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type IconButtonVariant = 'filled' | 'outlined' | 'ghost';
export type IconButtonSize = 'small' | 'medium' | 'large';

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  color?: string;
  backgroundColor?: string;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel: string;
  haptic?: boolean;
}

const sizeMap: Record<IconButtonSize, number> = {
  small: 36,
  medium: 44,
  large: 56,
};

export function IconButton({
  icon,
  onPress,
  variant = 'ghost',
  size = 'medium',
  color,
  backgroundColor,
  disabled = false,
  style,
  accessibilityLabel,
  haptic = true,
}: IconButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(animationValues.pressedScale, springs.snappy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, springs.gentle);
  }, [scale]);

  const handlePress = useCallback(() => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [haptic, onPress]);

  const buttonStyles = getButtonStyles(variant, size, disabled, backgroundColor);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[buttonStyles, animatedStyle, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
    >
      {icon}
    </AnimatedPressable>
  );
}

function getButtonStyles(
  variant: IconButtonVariant,
  size: IconButtonSize,
  disabled: boolean,
  customBackgroundColor?: string
): ViewStyle {
  const dimension = sizeMap[size];

  const baseStyles: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? animationValues.disabledOpacity : 1,
  };

  const variantStyles: Record<IconButtonVariant, ViewStyle> = {
    filled: {
      backgroundColor: customBackgroundColor || colors.rose,
      ...shadows.sm,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
  };

  return {
    ...baseStyles,
    ...variantStyles[variant],
  };
}

function getIconColor(variant: IconButtonVariant): string {
  switch (variant) {
    case 'filled':
      return colors.textInverse;
    case 'outlined':
    case 'ghost':
      return colors.textPrimary;
  }
}

function getIconSize(size: IconButtonSize): number {
  switch (size) {
    case 'small':
      return 18;
    case 'medium':
      return 22;
    case 'large':
      return 28;
  }
}

const styles = StyleSheet.create({});
