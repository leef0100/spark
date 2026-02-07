import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';

interface ExpirationTimerProps {
  expiresAt: string | null;
  hasMessages: boolean;
  variant?: 'badge' | 'banner' | 'inline';
}

export function ExpirationTimer({
  expiresAt,
  hasMessages,
  variant = 'badge',
}: ExpirationTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Pulse animation for urgent state
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (hasMessages || !expiresAt) {
      // Timer stopped - conversation started
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);

      if (now >= expiry) {
        setIsExpired(true);
        setTimeRemaining('Expired');
        return;
      }

      const hoursLeft = differenceInHours(expiry, now);
      const minutesLeft = differenceInMinutes(expiry, now) % 60;

      setIsUrgent(hoursLeft < 12);

      if (hoursLeft >= 24) {
        const days = Math.floor(hoursLeft / 24);
        const remainingHours = hoursLeft % 24;
        setTimeRemaining(`${days}d ${remainingHours}h`);
      } else if (hoursLeft >= 1) {
        setTimeRemaining(`${hoursLeft}h ${minutesLeft}m`);
      } else {
        const secondsLeft = differenceInSeconds(expiry, now) % 60;
        setTimeRemaining(`${minutesLeft}m ${secondsLeft}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, hasMessages]);

  useEffect(() => {
    if (isUrgent && !hasMessages) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
    }
  }, [isUrgent, hasMessages]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Don't show timer if conversation has started
  if (hasMessages) {
    return null;
  }

  if (isExpired) {
    if (variant === 'banner') {
      return (
        <View style={[styles.banner, styles.bannerExpired]}>
          <Text style={styles.bannerText}>This match has expired</Text>
        </View>
      );
    }
    return null;
  }

  if (variant === 'badge') {
    return (
      <Animated.View
        style={[
          styles.badge,
          isUrgent && styles.badgeUrgent,
          animatedStyle,
        ]}
      >
        <Text style={[styles.badgeText, isUrgent && styles.badgeTextUrgent]}>
          {timeRemaining}
        </Text>
      </Animated.View>
    );
  }

  if (variant === 'banner') {
    return (
      <Animated.View
        style={[
          styles.banner,
          isUrgent && styles.bannerUrgent,
          animatedStyle,
        ]}
      >
        <Text style={styles.bannerIcon}>{isUrgent ? '⏰' : '⏳'}</Text>
        <Text style={styles.bannerText}>
          Send a message within {timeRemaining} or this match expires
        </Text>
      </Animated.View>
    );
  }

  // Inline variant
  return (
    <View style={styles.inline}>
      <Text style={[styles.inlineText, isUrgent && styles.inlineTextUrgent]}>
        Expires in {timeRemaining}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeUrgent: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  badgeText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  badgeTextUrgent: {
    color: colors.textInverse,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  bannerUrgent: {
    backgroundColor: colors.roseLight,
    borderWidth: 1,
    borderColor: colors.rose,
  },
  bannerExpired: {
    backgroundColor: colors.lightGray,
  },
  bannerIcon: {
    fontSize: 16,
  },
  bannerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineText: {
    ...typography.caption,
    color: colors.muted,
  },
  inlineTextUrgent: {
    color: colors.error,
    fontWeight: '600',
  },
});
