import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useUserPresence, formatLastSeen } from '../../services/presence';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface OnlineIndicatorProps {
  userId: string | null;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  style?: object;
}

const SIZES = {
  small: 8,
  medium: 10,
  large: 14,
};

export function OnlineIndicator({
  userId,
  size = 'medium',
  showLabel = false,
  style,
}: OnlineIndicatorProps) {
  const { status, lastSeen, isLoading } = useUserPresence(userId);

  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    if (status === 'online') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
    }
  }, [status, pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (isLoading) {
    return null;
  }

  const dotSize = SIZES[size];
  const statusColor = status === 'online'
    ? colors.success
    : status === 'away'
    ? colors.warning
    : colors.muted;

  const getStatusLabel = () => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      default:
        return formatLastSeen(lastSeen);
    }
  };

  if (showLabel) {
    return (
      <View style={[styles.labelContainer, style]}>
        <Animated.View
          style={[
            styles.dot,
            { width: dotSize, height: dotSize, backgroundColor: statusColor },
            status === 'online' && pulseStyle,
          ]}
        />
        <Text style={styles.label}>{getStatusLabel()}</Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.dot,
        { width: dotSize, height: dotSize, backgroundColor: statusColor },
        status === 'online' && pulseStyle,
        style,
      ]}
    />
  );
}

/**
 * Compact online badge to overlay on avatars
 */
export function OnlineBadge({
  userId,
  size = 'small',
}: {
  userId: string | null;
  size?: 'small' | 'medium';
}) {
  const { isOnline } = useUserPresence(userId);

  if (!isOnline) {
    return null;
  }

  const dotSize = size === 'small' ? 10 : 14;

  return (
    <View
      style={[
        styles.badge,
        {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    borderRadius: 50,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  badge: {
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});
