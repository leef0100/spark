import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { spacing, borderRadius } from '../../../theme/spacing';

const AVATAR_SIZE = 56;

export function MatchesSkeleton() {
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  return (
    <View style={styles.container}>
      {/* Header skeleton */}
      <View style={styles.header}>
        <SkeletonBox shimmerValue={shimmerValue} width={120} height={32} />
      </View>

      {/* New matches row skeleton */}
      <View style={styles.newMatchesSection}>
        <SkeletonBox shimmerValue={shimmerValue} width={100} height={12} style={styles.sectionLabel} />
        <View style={styles.newMatchesRow}>
          {[0, 1, 2, 3].map((index) => (
            <SkeletonAvatar key={index} shimmerValue={shimmerValue} />
          ))}
        </View>
      </View>

      {/* Conversations skeleton */}
      <View style={styles.conversationsSection}>
        <SkeletonBox shimmerValue={shimmerValue} width={80} height={12} style={styles.sectionLabel} />
        {[0, 1, 2, 3].map((index) => (
          <SkeletonConversation key={index} shimmerValue={shimmerValue} />
        ))}
      </View>
    </View>
  );
}

interface SkeletonBoxProps {
  shimmerValue: SharedValue<number>;
  width: number;
  height: number;
  style?: object;
}

function SkeletonBox({ shimmerValue, width, height, style }: SkeletonBoxProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmerValue.value, [0, 0.5, 1], [0.3, 0.6, 0.3]);
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        styles.skeletonBox,
        { width, height },
        animatedStyle,
        style,
      ]}
    />
  );
}

function SkeletonAvatar({ shimmerValue }: { shimmerValue: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmerValue.value, [0, 0.5, 1], [0.3, 0.6, 0.3]);
    return { opacity };
  });

  return (
    <View style={styles.avatarItem}>
      <Animated.View style={[styles.avatarCircle, animatedStyle]} />
      <Animated.View style={[styles.avatarName, animatedStyle]} />
    </View>
  );
}

function SkeletonConversation({ shimmerValue }: { shimmerValue: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmerValue.value, [0, 0.5, 1], [0.3, 0.6, 0.3]);
    return { opacity };
  });

  return (
    <View style={styles.conversationItem}>
      <Animated.View style={[styles.conversationAvatar, animatedStyle]} />
      <View style={styles.conversationContent}>
        <Animated.View style={[styles.conversationName, animatedStyle]} />
        <Animated.View style={[styles.conversationMessage, animatedStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  skeletonBox: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.sm,
  },
  newMatchesSection: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  newMatchesRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  avatarItem: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.lightGray,
  },
  avatarName: {
    width: 50,
    height: 12,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  conversationsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  conversationAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.lightGray,
  },
  conversationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  conversationName: {
    width: 100,
    height: 16,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  conversationMessage: {
    width: 180,
    height: 14,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.sm,
  },
});
