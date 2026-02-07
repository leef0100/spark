import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_HEIGHT = SCREEN_WIDTH * (5 / 4);

export function FeedSkeleton() {
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
      <SkeletonPhoto shimmerValue={shimmerValue} />
      <View style={styles.content}>
        <SkeletonPrompt shimmerValue={shimmerValue} />
      </View>
    </View>
  );
}

function SkeletonPhoto({ shimmerValue }: { shimmerValue: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmerValue.value, [0, 0.5, 1], [0.3, 0.6, 0.3]);
    return { opacity };
  });

  return (
    <Animated.View style={[styles.photo, animatedStyle]}>
      {/* Name overlay skeleton */}
      <View style={styles.nameOverlay}>
        <View style={styles.nameLine} />
        <View style={styles.locationLine} />
      </View>
    </Animated.View>
  );
}

function SkeletonPrompt({ shimmerValue }: { shimmerValue: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmerValue.value, [0, 0.5, 1], [0.3, 0.6, 0.3]);
    return { opacity };
  });

  return (
    <Animated.View style={[styles.prompt, animatedStyle]}>
      <View style={styles.promptQuestionLine} />
      <View style={styles.promptAnswerLine1} />
      <View style={styles.promptAnswerLine2} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  photo: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    backgroundColor: colors.cream,
    justifyContent: 'flex-end',
  },
  nameOverlay: {
    padding: spacing.lg,
  },
  nameLine: {
    width: 180,
    height: 32,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  locationLine: {
    width: 120,
    height: 16,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.sm,
  },
  content: {
    padding: spacing.md,
  },
  prompt: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  promptQuestionLine: {
    width: 100,
    height: 12,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  promptAnswerLine1: {
    width: '100%',
    height: 20,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  promptAnswerLine2: {
    width: '70%',
    height: 20,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.sm,
  },
});
