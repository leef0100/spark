import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useOnboardingStore } from '../../../stores/onboardingStore';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';

export function NameStep() {
  const { firstName, setFirstName } = useOnboardingStore();

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Text style={styles.title}>What's your{'\n'}first name?</Text>
        <Text style={styles.subtitle}>
          This is how you'll appear on Spark
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.inputContainer}>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          style={styles.input}
          placeholder="Your first name"
          placeholderTextColor={colors.muted}
          autoCapitalize="words"
          autoComplete="given-name"
          textContentType="givenName"
          autoFocus
          maxLength={50}
        />
        <Text style={styles.hint}>
          This can't be changed later
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
  inputContainer: {
    marginTop: spacing.xxl,
  },
  input: {
    ...typography.h2,
    color: colors.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: colors.rose,
    paddingVertical: spacing.md,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.sm,
  },
});
