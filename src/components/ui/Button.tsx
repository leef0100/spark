import React, { useCallback } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, layout } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { springs, animationValues } from '../../theme/animations';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  haptic = true,
}: ButtonProps) {
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
    onPress?.();
  }, [haptic, onPress]);

  const buttonStyles = getButtonStyles(variant, size, disabled, fullWidth);
  const textStyles = getTextStyles(variant, size, disabled);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[buttonStyles, animatedStyle, style]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.textInverse : colors.rose}
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={[textStyles, textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </AnimatedPressable>
  );
}

function getButtonStyles(
  variant: ButtonVariant,
  size: ButtonSize,
  disabled: boolean,
  fullWidth: boolean
): ViewStyle {
  const baseStyles: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    opacity: disabled ? animationValues.disabledOpacity : 1,
  };

  // Size styles
  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    small: {
      height: layout.buttonHeightSmall,
      paddingHorizontal: spacing.md,
    },
    medium: {
      height: layout.buttonHeight,
      paddingHorizontal: spacing.lg,
    },
    large: {
      height: layout.buttonHeight + 8,
      paddingHorizontal: spacing.xl,
    },
  };

  // Variant styles
  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: colors.rose,
      ...shadows.sm,
    },
    secondary: {
      backgroundColor: colors.cream,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    destructive: {
      backgroundColor: colors.error,
      ...shadows.sm,
    },
  };

  return {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...(fullWidth && { width: '100%' }),
  };
}

function getTextStyles(
  variant: ButtonVariant,
  size: ButtonSize,
  disabled: boolean
): TextStyle {
  const baseStyles: TextStyle = {
    ...typography.button,
  };

  const sizeStyles: Record<ButtonSize, TextStyle> = {
    small: typography.buttonSmall,
    medium: typography.button,
    large: {
      ...typography.button,
      fontSize: 18,
    },
  };

  const variantStyles: Record<ButtonVariant, TextStyle> = {
    primary: {
      color: colors.textInverse,
    },
    secondary: {
      color: colors.textPrimary,
    },
    ghost: {
      color: colors.rose,
    },
    destructive: {
      color: colors.textInverse,
    },
  };

  return {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
}

const styles = StyleSheet.create({});
