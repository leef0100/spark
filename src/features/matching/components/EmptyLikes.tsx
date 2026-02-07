import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

export function EmptyLikes() {
  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeIn.delay(100).duration(400)}
        style={styles.iconContainer}
      >
        <Text style={styles.icon}>💝</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(400)}>
        <Text style={styles.title}>No likes yet</Text>
        <Text style={styles.subtitle}>
          When someone likes your profile,{'\n'}they'll appear here
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.tip}>
        <Text style={styles.tipText}>
          Tip: Complete your profile and add more photos{'\n'}to get more likes!
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.roseLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  tip: {
    marginTop: spacing.xxl,
    backgroundColor: colors.cream,
    padding: spacing.lg,
    borderRadius: 12,
  },
  tipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
