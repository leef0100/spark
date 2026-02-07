import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format, differenceInYears } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '../../../stores/onboardingStore';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';

export function BirthdayStep() {
  const { birthDate, setBirthDate } = useOnboardingStore();
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  // Default to 25 years ago if no date set
  const currentDate = birthDate || new Date(Date.now() - 25 * 365.25 * 24 * 60 * 60 * 1000);

  // Calculate age
  const age = birthDate ? differenceInYears(new Date(), birthDate) : null;
  const isValidAge = age !== null && age >= 18;

  // Max date: 18 years ago
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);

  // Min date: 100 years ago
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100);

  const handleChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      setBirthDate(selectedDate);
      Haptics.selectionAsync();
    }
  };

  const handlePress = () => {
    if (Platform.OS === 'android') {
      setShowPicker(true);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Text style={styles.title}>When's your{'\n'}birthday?</Text>
        <Text style={styles.subtitle}>
          You must be at least 18 to use Spark
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.inputContainer}>
        {Platform.OS === 'android' && (
          <Pressable onPress={handlePress} style={styles.dateButton}>
            <Text style={styles.dateText}>
              {birthDate ? format(birthDate, 'MMMM d, yyyy') : 'Select your birthday'}
            </Text>
          </Pressable>
        )}

        {showPicker && (
          <DateTimePicker
            value={currentDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
            maximumDate={maxDate}
            minimumDate={minDate}
            textColor={colors.textPrimary}
            themeVariant="light"
            style={styles.picker}
          />
        )}

        {age !== null && (
          <View style={styles.ageContainer}>
            <Text style={[styles.ageText, !isValidAge && styles.ageTextError]}>
              {isValidAge ? `You're ${age} years old` : 'You must be at least 18'}
            </Text>
          </View>
        )}
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
    alignItems: 'center',
  },
  dateButton: {
    backgroundColor: colors.cream,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  dateText: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  picker: {
    width: '100%',
    height: 200,
  },
  ageContainer: {
    marginTop: spacing.lg,
  },
  ageText: {
    ...typography.bodyLarge,
    color: colors.success,
    fontWeight: '600',
  },
  ageTextError: {
    color: colors.error,
  },
});
