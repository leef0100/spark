import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '../../../stores/onboardingStore';
import { Chip } from '../../../components/ui/Chip';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import type { GenderType } from '../../../lib/database.types';

const GENDER_OPTIONS: { value: GenderType; label: string; emoji: string }[] = [
  { value: 'woman', label: 'Woman', emoji: '👩' },
  { value: 'man', label: 'Man', emoji: '👨' },
  { value: 'nonbinary', label: 'Non-binary', emoji: '🧑' },
];

export function GenderStep() {
  const { gender, setGender } = useOnboardingStore();

  const handleSelect = (value: GenderType) => {
    setGender(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Text style={styles.title}>How do you{'\n'}identify?</Text>
        <Text style={styles.subtitle}>
          Select the option that best describes you
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.optionsContainer}>
        {GENDER_OPTIONS.map((option, index) => (
          <Animated.View
            key={option.value}
            entering={FadeInDown.delay(250 + index * 100).duration(400)}
          >
            <Pressable
              onPress={() => handleSelect(option.value)}
              style={[
                styles.optionButton,
                gender === option.value && styles.optionButtonSelected,
              ]}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <Text
                style={[
                  styles.optionLabel,
                  gender === option.value && styles.optionLabelSelected,
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
          This will be displayed on your profile
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
  optionEmoji: {
    fontSize: 32,
  },
  optionLabel: {
    ...typography.h3,
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
