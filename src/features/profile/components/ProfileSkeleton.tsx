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
const PHOTO_HEIGHT = SCREEN_WIDTH * (5 / 4) * 0.6;

export function ProfileSkeleton() {
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
      {/* Header */}
      <View style={styles.header}>
        <SkeletonBox shimmerValue={shimmerValue} width={32} height={32} radius={16} />
        <SkeletonBox shimmerValue={shimmerValue} width={100} height={36} radius={18} />
      </View>

      {/* Preview Card */}
      <View style={styles.previewCard}>
        <SkeletonBox shimmerValue={shimmerValue} width={60} height={12} />

        {/* Photo */}
        <View style={styles.photoContainer}>
          <SkeletonBox shimmerValue={shimmerValue} width={SCREEN_WIDTH - spacing.lg * 4} height={PHOTO_HEIGHT} radius={borderRadius.lg} />
        </View>

        {/* Prompt */}
        <View style={styles.promptCard}>
          <SkeletonBox shimmerValue={shimmerValue} width={100} height={12} />
          <SkeletonBox shimmerValue={shimmerValue} width={200} height={18} style={styles.promptAnswer} />
        </View>
      </View>
    </View>
  );
}

interface SkeletonBoxProps {
  shimmerValue: SharedValue<number>;
  width: number;
  height: number;
  radius?: number;
  style?: object;
}

function SkeletonBox({ shimmerValue, width, height, radius = borderRadius.sm, style }: SkeletonBoxProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmerValue.value, [0, 0.5, 1], [0.3, 0.6, 0.3]);
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        styles.skeletonBox,
        { width, height, borderRadius: radius },
        animatedStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  previewCard: {
    paddingHorizontal: spacing.lg,
  },
  photoContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  promptCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  promptAnswer: {
    marginTop: spacing.sm,
  },
  skeletonBox: {
    backgroundColor: colors.lightGray,
  },
});
