import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

interface OnboardingStepProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function OnboardingStep({
  title,
  subtitle,
  children,
  style,
}: OnboardingStepProps) {
  return (
    <Animated.View
      entering={FadeInRight.duration(300)}
      exiting={FadeOutLeft.duration(200)}
      style={[styles.container, style]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  content: {
    flex: 1,
  },
});
