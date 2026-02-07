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

export function ChatSkeleton() {
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
      {/* Other person's messages */}
      <SkeletonBubble shimmerValue={shimmerValue} isOwn={false} width={200} />
      <SkeletonBubble shimmerValue={shimmerValue} isOwn={false} width={150} />

      {/* Own messages */}
      <SkeletonBubble shimmerValue={shimmerValue} isOwn={true} width={180} />

      {/* Other person's messages */}
      <SkeletonBubble shimmerValue={shimmerValue} isOwn={false} width={220} />
      <SkeletonBubble shimmerValue={shimmerValue} isOwn={false} width={100} />

      {/* Own messages */}
      <SkeletonBubble shimmerValue={shimmerValue} isOwn={true} width={160} />
      <SkeletonBubble shimmerValue={shimmerValue} isOwn={true} width={120} />
    </View>
  );
}

interface SkeletonBubbleProps {
  shimmerValue: SharedValue<number>;
  isOwn: boolean;
  width: number;
}

function SkeletonBubble({ shimmerValue, isOwn, width }: SkeletonBubbleProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmerValue.value, [0, 0.5, 1], [0.3, 0.6, 0.3]);
    return { opacity };
  });

  return (
    <View style={[styles.bubbleContainer, isOwn && styles.bubbleContainerOwn]}>
      <Animated.View
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
          { width },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  bubbleContainer: {
    alignItems: 'flex-start',
  },
  bubbleContainerOwn: {
    alignItems: 'flex-end',
  },
  bubble: {
    height: 40,
    borderRadius: borderRadius.lg,
  },
  bubbleOwn: {
    backgroundColor: colors.roseMedium,
    borderBottomRightRadius: borderRadius.xs,
  },
  bubbleOther: {
    backgroundColor: colors.lightGray,
    borderBottomLeftRadius: borderRadius.xs,
  },
});
