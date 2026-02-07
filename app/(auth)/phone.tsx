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
  Modal,
  FlatList,
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

// Common country codes
const COUNTRY_CODES = [
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '+1', country: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+82', country: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: '+86', country: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: '+27', country: 'ZA', flag: '🇿🇦', name: 'South Africa' },
  { code: '+971', country: 'AE', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', country: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+65', country: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: '+852', country: 'HK', flag: '🇭🇰', name: 'Hong Kong' },
  { code: '+31', country: 'NL', flag: '🇳🇱', name: 'Netherlands' },
];

export default function PhoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<RNTextInput>(null);

  const { phoneNumber, countryCode, setPhoneNumber, setCountryCode } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];

  const formatPhoneNumber = (text: string) => {
    // Remove non-digits
    const digits = text.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX for US/CA
    if (countryCode === '+1') {
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }

    return digits;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
    setError(null);
  };

  const getFullPhoneNumber = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    return `${countryCode}${digits}`;
  };

  const isValidPhone = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.length >= 10;
  };

  const handleContinue = async () => {
    if (!isValidPhone()) {
      setError('Please enter a valid phone number');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fullPhone = getFullPhoneNumber();
      const result = await authService.sendOTP(fullPhone);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push('/(auth)/verify');
      } else {
        setError(result.error || 'Failed to send verification code');
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
            <Text style={styles.title}>What's your{'\n'}phone number?</Text>
          </Animated.View>

          <Spacer size="sm" />

          <Animated.View entering={FadeInDown.delay(300).duration(600)}>
            <Text style={styles.subtitle}>
              We'll send you a verification code
            </Text>
          </Animated.View>

          <Spacer size="xxl" />

          {/* Phone input */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(600)}
            style={styles.inputContainer}
          >
            {/* Country code picker */}
            <Pressable
              onPress={() => setShowCountryPicker(true)}
              style={styles.countryButton}
            >
              <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
              <Text style={styles.countryCode}>{countryCode}</Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </Pressable>

            {/* Phone number input */}
            <View style={styles.phoneInputWrapper}>
              <RNTextInput
                ref={inputRef}
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                style={styles.phoneInput}
                placeholder="(555) 555-5555"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                maxLength={14}
                autoFocus
              />
            </View>
          </Animated.View>

          {/* Error message */}
          {error && (
            <Animated.View entering={FadeIn}>
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          <Spacer flex={1} />
        </ScrollView>

        {/* Continue button */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(600)}
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
        >
          <Button
            title="Continue"
            onPress={handleContinue}
            loading={isLoading}
            disabled={!isValidPhone()}
            fullWidth
            size="large"
          />
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Country picker modal */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <Pressable onPress={() => setShowCountryPicker(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </Pressable>
          </View>

          <FlatList
            data={COUNTRY_CODES}
            keyExtractor={(item) => `${item.country}-${item.code}`}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.countryRow,
                  item.code === countryCode && styles.countryRowSelected,
                ]}
                onPress={() => {
                  setCountryCode(item.code);
                  setShowCountryPicker(false);
                  Haptics.selectionAsync();
                }}
              >
                <Text style={styles.countryRowFlag}>{item.flag}</Text>
                <Text style={styles.countryRowName}>{item.name}</Text>
                <Text style={styles.countryRowCode}>{item.code}</Text>
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </Modal>
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
    flexDirection: 'row',
    gap: spacing.sm,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  countryFlag: {
    fontSize: 24,
  },
  countryCode: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  dropdownIcon: {
    fontSize: 10,
    color: colors.muted,
  },
  phoneInputWrapper: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  phoneInput: {
    ...typography.h3,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    letterSpacing: 1,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  modalClose: {
    ...typography.body,
    color: colors.rose,
    fontWeight: '600',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  countryRowSelected: {
    backgroundColor: colors.roseLight,
  },
  countryRowFlag: {
    fontSize: 28,
  },
  countryRowName: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  countryRowCode: {
    ...typography.body,
    color: colors.muted,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 28 + spacing.md,
  },
});
