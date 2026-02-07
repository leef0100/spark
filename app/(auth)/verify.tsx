import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '../../src/components/ui/Button';
import { Container } from '../../src/components/layout/Container';
import { Spacer } from '../../src/components/layout/Spacer';
import { useAuthStore } from '../../src/stores/authStore';
import { authService } from '../../src/features/auth/services/authService';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const CODE_LENGTH = 6;

export default function VerifyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<RNTextInput>(null);

  const { phoneNumber, countryCode } = useAuthStore();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const shakeAnimation = useSharedValue(0);

  const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
  const maskedPhone = `${countryCode} ••• ••• ${phoneNumber.slice(-4)}`;

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Auto-verify when code is complete
  useEffect(() => {
    if (code.length === CODE_LENGTH) {
      handleVerify();
    }
  }, [code]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnimation.value }],
  }));

  const triggerShake = () => {
    shakeAnimation.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const handleCodeChange = (text: string) => {
    // Only allow digits
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    setError(null);

    // Haptic feedback on each digit
    if (digits.length > code.length) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleVerify = async () => {
    if (code.length !== CODE_LENGTH) {
      setError('Please enter the complete code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.verifyOTP(fullPhoneNumber, code);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (result.isNewUser) {
          // New user - go to onboarding
          router.replace('/(auth)/onboarding');
        } else {
          // Existing user - go to main app
          router.replace('/(tabs)/discover');
        }
      } else {
        setError(result.error || 'Invalid code. Please try again.');
        triggerShake();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setCode('');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setCanResend(false);
    setResendTimer(60);
    setError(null);
    setCode('');

    try {
      const result = await authService.sendOTP(fullPhoneNumber);
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setError('Failed to resend code');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      setError('Failed to resend code');
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleBoxPress = () => {
    inputRef.current?.focus();
  };

  return (
    <Container safeAreaEdges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Back button */}
          <Animated.View entering={FadeIn.delay(100)}>
            <Pressable onPress={handleBack} style={styles.backButton} hitSlop={12}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
          </Animated.View>

          <Spacer size="xl" />

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <Text style={styles.title}>Enter the code</Text>
          </Animated.View>

          <Spacer size="sm" />

          <Animated.View entering={FadeInDown.delay(300).duration(600)}>
            <Text style={styles.subtitle}>
              We sent a verification code to{'\n'}
              <Text style={styles.phoneText}>{maskedPhone}</Text>
            </Text>
          </Animated.View>

          <Spacer size="xxl" />

          {/* Code input boxes */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <Pressable onPress={handleBoxPress}>
              <Animated.View style={[styles.codeContainer, shakeStyle]}>
                {Array.from({ length: CODE_LENGTH }).map((_, index) => {
                  const digit = code[index];
                  const isFilled = digit !== undefined;
                  const isActive = index === code.length;

                  return (
                    <View
                      key={index}
                      style={[
                        styles.codeBox,
                        isFilled && styles.codeBoxFilled,
                        isActive && styles.codeBoxActive,
                        error && styles.codeBoxError,
                      ]}
                    >
                      <Text style={styles.codeDigit}>{digit || ''}</Text>
                      {isActive && <View style={styles.cursor} />}
                    </View>
                  );
                })}
              </Animated.View>
            </Pressable>

            {/* Hidden input */}
            <RNTextInput
              ref={inputRef}
              value={code}
              onChangeText={handleCodeChange}
              style={styles.hiddenInput}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              autoFocus
              maxLength={CODE_LENGTH}
            />
          </Animated.View>

          {/* Error message */}
          {error && (
            <Animated.View entering={FadeIn}>
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          <Spacer size="xl" />

          {/* Resend button */}
          <Animated.View entering={FadeIn.delay(500)}>
            <Pressable
              onPress={handleResend}
              disabled={!canResend}
              style={styles.resendButton}
            >
              <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
                {canResend
                  ? "Didn't receive it? Resend code"
                  : `Resend code in ${resendTimer}s`}
              </Text>
            </Pressable>
          </Animated.View>

          <Spacer flex={1} />
        </View>

        {/* Verify button */}
        <Animated.View
          entering={FadeIn.delay(600)}
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
        >
          <Button
            title="Verify"
            onPress={handleVerify}
            loading={isLoading}
            disabled={code.length !== CODE_LENGTH}
            fullWidth
            size="large"
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </Container>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
  },
  backText: {
    ...typography.body,
    color: colors.rose,
    fontWeight: '500',
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  phoneText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  codeBox: {
    width: 48,
    height: 56,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeBoxFilled: {
    borderColor: colors.rose,
    backgroundColor: colors.roseLight,
  },
  codeBoxActive: {
    borderColor: colors.rose,
  },
  codeBoxError: {
    borderColor: colors.error,
    backgroundColor: 'rgba(212, 78, 78, 0.1)',
  },
  codeDigit: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 24,
    backgroundColor: colors.rose,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  resendButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  resendText: {
    ...typography.body,
    color: colors.rose,
    fontWeight: '500',
  },
  resendTextDisabled: {
    color: colors.muted,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
