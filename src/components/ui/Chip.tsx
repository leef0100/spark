import React, { useCallback } from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { springs, animationValues } from '../../theme/animations';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ChipVariant = 'filled' | 'outlined' | 'soft';
export type ChipSize = 'small' | 'medium' | 'large';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: ChipVariant;
  size?: ChipSize;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Chip({
  label,
  selected = false,
  onPress,
  variant = 'outlined',
  size = 'medium',
  disabled = false,
  icon,
  style,
  textStyle,
}: ChipProps) {
  const scale = useSharedValue(1);
  const selectedAnim = useSharedValue(selected ? 1 : 0);

  React.useEffect(() => {
    selectedAnim.value = withSpring(selected ? 1 : 0, springs.snappy);
  }, [selected, selectedAnim]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      selectedAnim.value,
      [0, 1],
      [variant === 'filled' ? colors.rose : 'transparent', colors.rose]
    );

    const borderColor = interpolateColor(
      selectedAnim.value,
      [0, 1],
      [colors.border, colors.rose]
    );

    return {
      transform: [{ scale: scale.value }],
      backgroundColor:
        variant === 'soft'
          ? interpolateColor(
              selectedAnim.value,
              [0, 1],
              [colors.roseLight, colors.roseMedium]
            )
          : backgroundColor,
      borderColor,
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      selectedAnim.value,
      [0, 1],
      [
        variant === 'filled' ? colors.textInverse : colors.textPrimary,
        variant === 'soft' ? colors.rose : colors.textInverse,
      ]
    );

    return { color };
  });

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(animationValues.pressedScale, springs.snappy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, springs.gentle);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  const chipStyles = getChipStyles(variant, size, disabled);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || !onPress}
      style={[chipStyles, animatedStyle, style]}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
    >
      {icon}
      <Animated.Text style={[getTextStyles(size), animatedTextStyle, textStyle]}>
        {label}
      </Animated.Text>
    </AnimatedPressable>
  );
}

function getChipStyles(
  variant: ChipVariant,
  size: ChipSize,
  disabled: boolean
): ViewStyle {
  const sizeStyles: Record<ChipSize, ViewStyle> = {
    small: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    medium: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
    },
    large: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      borderRadius: borderRadius.lg,
    },
  };

  const baseStyles: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: variant === 'outlined' ? 1.5 : 0,
    opacity: disabled ? animationValues.disabledOpacity : 1,
  };

  return {
    ...baseStyles,
    ...sizeStyles[size],
  };
}

function getTextStyles(size: ChipSize): TextStyle {
  const sizeStyles: Record<ChipSize, TextStyle> = {
    small: typography.caption,
    medium: typography.label,
    large: typography.body,
  };

  return {
    ...sizeStyles[size],
    fontWeight: '500',
  };
}

const styles = StyleSheet.create({});
