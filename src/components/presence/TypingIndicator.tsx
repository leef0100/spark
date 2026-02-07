import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  SharedValue,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface TypingIndicatorProps {
  userName?: string;
  style?: object;
}

export function TypingIndicator({ userName, style }: TypingIndicatorProps) {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animateDot = (value: SharedValue<number>, delay: number) => {
      value.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(-4, { duration: 300 }),
            withTiming(0, { duration: 300 })
          ),
          -1,
          true
        )
      );
    };

    animateDot(dot1, 0);
    animateDot(dot2, 150);
    animateDot(dot3, 300);
  }, [dot1, dot2, dot3]);

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1.value }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2.value }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3.value }],
  }));

  return (
    <View style={[styles.container, style]}>
      <View style={styles.bubble}>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, dot1Style]} />
          <Animated.View style={[styles.dot, dot2Style]} />
          <Animated.View style={[styles.dot, dot3Style]} />
        </View>
      </View>
      {userName && <Text style={styles.text}>{userName} is typing...</Text>}
    </View>
  );
}

/**
 * Inline typing indicator for chat header
 */
export function TypingIndicatorInline({ style }: { style?: object }) {
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  useEffect(() => {
    const animateDot = (value: SharedValue<number>, delay: number) => {
      value.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(0.3, { duration: 400 })
          ),
          -1,
          true
        )
      );
    };

    animateDot(dot1, 0);
    animateDot(dot2, 200);
    animateDot(dot3, 400);
  }, [dot1, dot2, dot3]);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1.value,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2.value,
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3.value,
  }));

  return (
    <View style={[styles.inlineContainer, style]}>
      <Text style={styles.inlineText}>typing</Text>
      <Animated.View style={[styles.inlineDot, dot1Style]} />
      <Animated.View style={[styles.inlineDot, dot2Style]} />
      <Animated.View style={[styles.inlineDot, dot3Style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubble: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.muted,
  },
  text: {
    ...typography.caption,
    color: colors.muted,
    fontStyle: 'italic',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  inlineText: {
    ...typography.caption,
    color: colors.muted,
    marginRight: 2,
  },
  inlineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.muted,
  },
});
