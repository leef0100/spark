import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { spacing, borderRadius, layout } from '../../../theme/spacing';
import { shadows } from '../../../theme/shadows';

interface DiscoveryActionBarProps {
  onPass: () => void;
  onLike: () => void;
  onComment: () => void;
  disabled?: boolean;
}

export function DiscoveryActionBar({
  onPass,
  onLike,
  onComment,
  disabled = false,
}: DiscoveryActionBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.actionBar}>
        <ActionButton
          icon="✕"
          label="Pass"
          variant="secondary"
          onPress={onPass}
          disabled={disabled}
        />
        <ActionButton
          icon="💬"
          label="Comment"
          variant="primary"
          onPress={onComment}
          disabled={disabled}
          size="large"
        />
        <ActionButton
          icon="♡"
          label="Like"
          variant="rose"
          onPress={onLike}
          disabled={disabled}
        />
      </View>
    </View>
  );
}

interface ActionButtonProps {
  icon: string;
  label: string;
  variant: 'primary' | 'secondary' | 'rose';
  onPress: () => void;
  disabled?: boolean;
  size?: 'normal' | 'large';
}

function ActionButton({
  icon,
  label,
  variant,
  onPress,
  disabled = false,
  size = 'normal',
}: ActionButtonProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (disabled) return;

    scale.value = withSequence(
      withSpring(0.85, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );

    const feedbackStyle =
      variant === 'secondary'
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium;

    Haptics.impactAsync(feedbackStyle);
    runOnJS(onPress)();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const buttonSize = size === 'large' ? 72 : 56;
  const iconSize = size === 'large' ? 32 : 24;

  const getBackgroundColor = () => {
    if (disabled) return colors.lightGray;
    switch (variant) {
      case 'rose':
        return colors.rose;
      case 'secondary':
        return colors.surface;
      case 'primary':
      default:
        return colors.charcoal;
    }
  };

  const getIconColor = () => {
    if (disabled) return colors.muted;
    switch (variant) {
      case 'secondary':
        return colors.muted;
      case 'rose':
      case 'primary':
      default:
        return colors.textInverse;
    }
  };

  return (
    <View style={styles.buttonWrapper}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={handlePress}
          disabled={disabled}
          style={[
            styles.actionButton,
            {
              width: buttonSize,
              height: buttonSize,
              backgroundColor: getBackgroundColor(),
            },
            variant === 'secondary' && styles.secondaryButton,
          ]}
        >
          <Text style={[styles.icon, { fontSize: iconSize, color: getIconColor() }]}>
            {icon}
          </Text>
        </Pressable>
      </Animated.View>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: layout.tabBarHeight,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: spacing.xl,
  },
  buttonWrapper: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButton: {
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: colors.border,
    shadowOpacity: 0.05,
  },
  icon: {
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  labelDisabled: {
    color: colors.muted,
  },
});
