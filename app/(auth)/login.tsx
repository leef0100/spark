import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
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

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<RNTextInput>(null);

  const { email, setEmail } = useAuthStore();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isValidEmail = (emailStr: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  const isValidPassword = (pass: string) => {
    return pass.length >= 6;
  };

  const canSubmit = isValidEmail(email) && isValidPassword(password);

  const handleSubmit = async () => {
    if (!canSubmit) {
      if (!isValidEmail(email)) {
        setError('Please enter a valid email address');
      } else if (!isValidPassword(password)) {
        setError('Password must be at least 6 characters');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = isSignUp
        ? await authService.signUp(email, password)
        : await authService.signIn(email, password);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (result.isNewUser) {
          router.replace('/(auth)/onboarding');
        } else {
          router.replace('/(tabs)/discover');
        }
      } else {
        setError(result.error || 'Authentication failed');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    Haptics.selectionAsync();
  };

  return (
    <Container safeAreaEdges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <Animated.View entering={FadeIn.delay(100)}>
            <Pressable onPress={handleBack} style={styles.backButton} hitSlop={12}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
          </Animated.View>

          <Spacer size="xl" />

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <Text style={styles.title}>
              {isSignUp ? 'Create your\naccount' : 'Welcome\nback'}
            </Text>
          </Animated.View>

          <Spacer size="sm" />

          <Animated.View entering={FadeInDown.delay(300).duration(600)}>
            <Text style={styles.subtitle}>
              {isSignUp
                ? 'Enter your email and create a password'
                : 'Sign in to continue'}
            </Text>
          </Animated.View>

          <Spacer size="xxl" />

          {/* Email input */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(600)}
            style={styles.inputContainer}
          >
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <RNTextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text.trim());
                  setError(null);
                }}
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                autoFocus
              />
            </View>
          </Animated.View>

          <Spacer size="lg" />

          {/* Password input */}
          <Animated.View
            entering={FadeInUp.delay(500).duration(600)}
            style={styles.inputContainer}
          >
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <RNTextInput
                ref={passwordRef}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(null);
                }}
                style={[styles.input, styles.passwordInput]}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                textContentType={isSignUp ? 'newPassword' : 'password'}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.showPasswordButton}
              >
                <Text style={styles.showPasswordText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Error message */}
          {error && (
            <Animated.View entering={FadeIn}>
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          <Spacer size="lg" />

          {/* Toggle sign up / sign in */}
          <Animated.View entering={FadeInUp.delay(600).duration(600)}>
            <Pressable onPress={toggleMode} style={styles.toggleButton}>
              <Text style={styles.toggleText}>
                {isSignUp
                  ? 'Already have an account? '
                  : "Don't have an account? "}
                <Text style={styles.toggleTextBold}>
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </Text>
              </Text>
            </Pressable>
          </Animated.View>

          <Spacer flex={1} />
        </ScrollView>

        {/* Submit button */}
        <Animated.View
          entering={FadeInUp.delay(700).duration(600)}
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
        >
          <Button
            title={isSignUp ? 'Create Account' : 'Sign In'}
            onPress={handleSubmit}
            loading={isLoading}
            disabled={!canSubmit}
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
  scrollContent: {
    flexGrow: 1,
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
  },
  inputContainer: {
    gap: spacing.xs,
  },
  inputLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  inputWrapper: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flex: 1,
  },
  passwordInput: {
    paddingRight: spacing.xs,
  },
  showPasswordButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  showPasswordText: {
    ...typography.bodySmall,
    color: colors.rose,
    fontWeight: '600',
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.sm,
  },
  toggleButton: {
    alignSelf: 'center',
    padding: spacing.sm,
  },
  toggleText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  toggleTextBold: {
    color: colors.rose,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
