import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useOnboardingStore } from '../../../stores/onboardingStore';
import { Spacer } from '../../../components/layout/Spacer';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';

export function WorkEducationStep() {
  const { jobTitle, company, education, setJobTitle, setCompany, setEducation } =
    useOnboardingStore();

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Text style={styles.title}>Tell us about{'\n'}yourself</Text>
        <Text style={styles.subtitle}>
          This is optional, but helps others get to know you
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Job Title</Text>
          <TextInput
            value={jobTitle}
            onChangeText={setJobTitle}
            style={styles.input}
            placeholder="e.g., Product Designer"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            maxLength={100}
          />
        </View>

        <Spacer size="lg" />

        <View style={styles.field}>
          <Text style={styles.label}>Company</Text>
          <TextInput
            value={company}
            onChangeText={setCompany}
            style={styles.input}
            placeholder="e.g., Acme Inc."
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            maxLength={100}
          />
        </View>

        <Spacer size="lg" />

        <View style={styles.field}>
          <Text style={styles.label}>Education</Text>
          <TextInput
            value={education}
            onChangeText={setEducation}
            style={styles.input}
            placeholder="e.g., Stanford University"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            maxLength={100}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Text style={styles.hint}>
          You can skip this step and add details later
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
  form: {
    marginTop: spacing.xxl,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
