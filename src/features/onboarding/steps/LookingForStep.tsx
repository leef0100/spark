import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '../../../stores/onboardingStore';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import type { LookingForType } from '../../../lib/database.types';

const LOOKING_FOR_OPTIONS: { value: LookingForType; label: string }[] = [
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
  { value: 'everyone', label: 'Everyone' },
];

export function LookingForStep() {
  const { lookingFor, setLookingFor } = useOnboardingStore();

  const handleToggle = (value: LookingForType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (value === 'everyone') {
      // If selecting everyone, clear other selections
      setLookingFor(['everyone']);
    } else {
      // Remove 'everyone' if selecting specific gender
      const filtered = lookingFor.filter((v) => v !== 'everyone');

      if (filtered.includes(value)) {
        // Remove if already selected
        setLookingFor(filtered.filter((v) => v !== value));
      } else {
        // Add to selection
        setLookingFor([...filtered, value]);
      }
    }
  };

  const isSelected = (value: LookingForType) => lookingFor.includes(value);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Text style={styles.title}>Who are you{'\n'}interested in?</Text>
        <Text style={styles.subtitle}>
          Select all that apply
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.optionsContainer}>
        {LOOKING_FOR_OPTIONS.map((option, index) => (
          <Animated.View
            key={option.value}
            entering={FadeInDown.delay(250 + index * 100).duration(400)}
          >
            <Pressable
              onPress={() => handleToggle(option.value)}
              style={[
                styles.optionButton,
                isSelected(option.value) && styles.optionButtonSelected,
              ]}
            >
              <View style={styles.checkbox}>
                {isSelected(option.value) && (
                  <View style={styles.checkboxInner} />
                )}
              </View>
              <Text
                style={[
                  styles.optionLabel,
                  isSelected(option.value) && styles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(600).duration(400)}>
        <Text style={styles.hint}>
          You can change this later in settings
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.lg,
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
  optionsContainer: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    gap: spacing.md,
  },
  optionButtonSelected: {
    borderColor: colors.rose,
    backgroundColor: colors.roseLight,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.rose,
  },
  optionLabel: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  optionLabelSelected: {
    color: colors.rose,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
});
