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
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

export function LikesSkeleton() {
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
        <SkeletonBox shimmerValue={shimmerValue} width={150} height={32} />
        <SkeletonBox shimmerValue={shimmerValue} width={100} height={20} style={styles.subtitle} />
      </View>

      {/* Grid skeleton */}
      <View style={styles.grid}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <SkeletonCard key={index} shimmerValue={shimmerValue} />
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

interface SkeletonCardProps {
  shimmerValue: SharedValue<number>;
}

function SkeletonCard({ shimmerValue }: SkeletonCardProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmerValue.value, [0, 0.5, 1], [0.3, 0.6, 0.3]);
    return { opacity };
  });

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <View style={styles.cardContent}>
        <View style={styles.cardName} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  skeletonBox: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cream,
    marginBottom: spacing.md,
    justifyContent: 'flex-end',
  },
  cardContent: {
    padding: spacing.md,
  },
  cardName: {
    width: 80,
    height: 20,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.sm,
  },
});
