import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '../../src/components/ui/Button';
import { SegmentedProgressBar } from '../../src/components/ui/ProgressBar';
import { Container } from '../../src/components/layout/Container';
import { Spacer } from '../../src/components/layout/Spacer';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { useAuthStore } from '../../src/stores/authStore';
import { profileService } from '../../src/features/profile/services/profileService';
import { supabase } from '../../src/lib/supabase';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

// Import step components
import { NameStep } from '../../src/features/onboarding/steps/NameStep';
import { BirthdayStep } from '../../src/features/onboarding/steps/BirthdayStep';
import { GenderStep } from '../../src/features/onboarding/steps/GenderStep';
import { LookingForStep } from '../../src/features/onboarding/steps/LookingForStep';
import { PhotosStep } from '../../src/features/onboarding/steps/PhotosStep';
import { PromptsStep } from '../../src/features/onboarding/steps/PromptsStep';
import { WorkEducationStep } from '../../src/features/onboarding/steps/WorkEducationStep';
import { LocationStep } from '../../src/features/onboarding/steps/LocationStep';

const STEP_COMPONENTS = [
  NameStep,
  BirthdayStep,
  GenderStep,
  LookingForStep,
  PhotosStep,
  PromptsStep,
  WorkEducationStep,
  LocationStep,
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    canProceed,
    firstName,
    birthDate,
    gender,
    lookingFor,
    photos,
    prompts,
    jobTitle,
    company,
    education,
    city,
    latitude,
    longitude,
    reset,
  } = useOnboardingStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLastStep = currentStep === totalSteps - 1;
  const StepComponent = STEP_COMPONENTS[currentStep];

  const handleNext = useCallback(async () => {
    if (!canProceed()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isLastStep) {
      await handleSubmit();
    } else {
      nextStep();
    }
  }, [canProceed, isLastStep, nextStep]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep === 0) {
      Alert.alert(
        'Exit Setup?',
        'Your progress will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => {
              reset();
              router.back();
            },
          },
        ]
      );
    } else {
      prevStep();
    }
  }, [currentStep, prevStep, reset, router]);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Create profile
      const { error: profileError } = await profileService.createProfile({
        id: user.id,
        first_name: firstName,
        birth_date: birthDate!.toISOString().split('T')[0],
        gender: gender!,
        looking_for: lookingFor,
        bio: null,
        height_cm: null,
        job_title: jobTitle || null,
        company: company || null,
        education: education || null,
        city: city || null,
        latitude,
        longitude,
      });

      if (profileError) {
        throw new Error(profileError);
      }

      // Upload photos
      for (const photo of photos) {
        await profileService.uploadPhoto(photo.uri, photo.position);
      }

      // Save prompts
      for (const prompt of prompts) {
        await profileService.upsertPrompt(
          prompt.promptText,
          prompt.answerText,
          prompt.position
        );
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      reset();
      router.replace('/(tabs)/discover');
    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert('Error', 'Failed to create profile. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonTitle = () => {
    if (isLastStep) return 'Complete Setup';
    if (currentStep === 6) return 'Skip'; // Work/Education is optional
    return 'Continue';
  };

  return (
    <Container safeAreaEdges={['top']} padding={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header with progress */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton} hitSlop={12}>
            <Text style={styles.backText}>
              {currentStep === 0 ? '✕' : '←'}
            </Text>
          </Pressable>

          <View style={styles.progressContainer}>
            <SegmentedProgressBar
              currentStep={currentStep}
              totalSteps={totalSteps}
            />
          </View>

          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>
              {currentStep + 1}/{totalSteps}
            </Text>
          </View>
        </View>

        {/* Step content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StepComponent />
        </ScrollView>

        {/* Footer with button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button
            title={getButtonTitle()}
            onPress={handleNext}
            loading={isSubmitting}
            disabled={!canProceed() && currentStep !== 6 && currentStep !== 7}
            fullWidth
            size="large"
          />
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  progressContainer: {
    flex: 1,
  },
  stepIndicator: {
    width: 40,
    alignItems: 'flex-end',
  },
  stepText: {
    ...typography.caption,
    color: colors.muted,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
