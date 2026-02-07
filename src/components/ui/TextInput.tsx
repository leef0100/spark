import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps as RNTextInputProps,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, layout } from '../../theme/spacing';
import { timing } from '../../theme/animations';

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  hint?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  multiline?: boolean;
  numberOfLines?: number;
}

export function TextInput({
  label,
  value,
  onChangeText,
  error,
  hint,
  maxLength,
  showCharacterCount = false,
  disabled = false,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  multiline = false,
  numberOfLines = 1,
  ...props
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<RNTextInput>(null);
  const labelPosition = useSharedValue(value ? 1 : 0);
  const focusAnimation = useSharedValue(0);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    labelPosition.value = withTiming(1, timing.normal);
    focusAnimation.value = withTiming(1, timing.normal);
  }, [labelPosition, focusAnimation]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (!value) {
      labelPosition.value = withTiming(0, timing.normal);
    }
    focusAnimation.value = withTiming(0, timing.normal);
  }, [labelPosition, focusAnimation, value]);

  const handlePress = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const animatedLabelStyle = useAnimatedStyle(() => {
    const translateY = interpolate(labelPosition.value, [0, 1], [0, -24]);
    const scale = interpolate(labelPosition.value, [0, 1], [1, 0.85]);
    const color = interpolateColor(
      focusAnimation.value,
      [0, 1],
      [colors.muted, colors.rose]
    );

    return {
      transform: [{ translateY }, { scale }],
      color: error ? colors.error : color,
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnimation.value,
      [0, 1],
      [colors.border, colors.rose]
    );

    return {
      borderColor: error ? colors.error : borderColor,
    };
  });

  const inputHeight = multiline
    ? Math.max(layout.inputHeight, numberOfLines * 24 + spacing.md * 2)
    : layout.inputHeight;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <Pressable onPress={handlePress}>
        <Animated.View
          style={[
            styles.container,
            { minHeight: inputHeight },
            disabled && styles.disabled,
            animatedContainerStyle,
          ]}
        >
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

          <View style={styles.inputWrapper}>
            <Animated.Text
              style={[
                styles.label,
                animatedLabelStyle,
                leftIcon ? { left: spacing.xl + spacing.sm } : undefined,
              ]}
            >
              {label}
            </Animated.Text>

            <RNTextInput
              ref={inputRef}
              value={value}
              onChangeText={onChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={[
                styles.input,
                multiline && styles.multilineInput,
                inputStyle,
              ]}
              placeholderTextColor={colors.muted}
              editable={!disabled}
              maxLength={maxLength}
              multiline={multiline}
              numberOfLines={numberOfLines}
              textAlignVertical={multiline ? 'top' : 'center'}
              {...props}
            />
          </View>

          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </Animated.View>
      </Pressable>

      <View style={styles.footer}>
        {(error || hint) && (
          <Text style={[styles.helperText, error && styles.errorText]}>
            {error || hint}
          </Text>
        )}
        {showCharacterCount && maxLength && (
          <Text
            style={[
              styles.characterCount,
              value.length >= maxLength && styles.characterCountMax,
            ]}
          >
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  disabled: {
    backgroundColor: colors.cream,
    opacity: 0.7,
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    left: 0,
    ...typography.body,
    color: colors.muted,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    minHeight: layout.inputHeight - spacing.sm,
  },
  multilineInput: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  helperText: {
    ...typography.caption,
    color: colors.muted,
    flex: 1,
  },
  errorText: {
    color: colors.error,
  },
  characterCount: {
    ...typography.caption,
    color: colors.muted,
    marginLeft: spacing.sm,
  },
  characterCountMax: {
    color: colors.error,
  },
});
