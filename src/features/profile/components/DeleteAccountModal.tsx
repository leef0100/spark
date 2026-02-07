import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useDeleteAccount } from '../hooks';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
}

type Step = 'warning' | 'confirm' | 'deleting';

const DELETE_CONFIRMATION_TEXT = 'DELETE';

export function DeleteAccountModal({ visible, onClose }: DeleteAccountModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const deleteAccount = useDeleteAccount();

  const [step, setStep] = useState<Step>('warning');
  const [confirmText, setConfirmText] = useState('');

  const handleClose = () => {
    if (step === 'deleting') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep('warning');
    setConfirmText('');
    onClose();
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('confirm');
  };

  const handleDelete = async () => {
    if (confirmText !== DELETE_CONFIRMATION_TEXT) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setStep('deleting');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    deleteAccount.mutate(undefined, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(auth)/welcome');
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setStep('confirm');
      },
    });
  };

  const isConfirmEnabled = confirmText === DELETE_CONFIRMATION_TEXT;

  const renderWarningStep = () => (
    <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
      <View style={styles.iconContainer}>
        <Text style={styles.warningIcon}>⚠️</Text>
      </View>

      <Text style={styles.heading}>Delete Your Account?</Text>
      <Text style={styles.description}>
        This action is permanent and cannot be undone. All your data will be permanently deleted, including:
      </Text>

      <View style={styles.bulletList}>
        <BulletPoint text="Your profile and photos" />
        <BulletPoint text="All your matches and conversations" />
        <BulletPoint text="Likes you've received and sent" />
        <BulletPoint text="Your preferences and settings" />
      </View>

      <Text style={styles.warningText}>
        You will not be able to recover any of this data.
      </Text>

      <View style={styles.buttonRow}>
        <Pressable style={styles.cancelButton} onPress={handleClose}>
          <Text style={styles.cancelButtonText}>Keep Account</Text>
        </Pressable>
        <Pressable style={styles.dangerButton} onPress={handleContinue}>
          <Text style={styles.dangerButtonText}>Continue</Text>
        </Pressable>
      </View>
    </Animated.View>
  );

  const renderConfirmStep = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(300)} style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.warningIcon}>🗑️</Text>
          </View>

          <Text style={styles.heading}>Confirm Deletion</Text>
          <Text style={styles.description}>
            To confirm account deletion, type{' '}
            <Text style={styles.confirmWord}>{DELETE_CONFIRMATION_TEXT}</Text>{' '}
            below:
          </Text>

          <TextInput
            value={confirmText}
            onChangeText={setConfirmText}
            style={[
              styles.confirmInput,
              isConfirmEnabled && styles.confirmInputValid,
            ]}
            placeholder={DELETE_CONFIRMATION_TEXT}
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
          />

          <View style={styles.buttonRow}>
            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep('warning');
                setConfirmText('');
              }}
            >
              <Text style={styles.cancelButtonText}>Go Back</Text>
            </Pressable>
            <Pressable
              style={[
                styles.dangerButton,
                !isConfirmEnabled && styles.dangerButtonDisabled,
              ]}
              onPress={handleDelete}
              disabled={!isConfirmEnabled}
            >
              <Text
                style={[
                  styles.dangerButtonText,
                  !isConfirmEnabled && styles.dangerButtonTextDisabled,
                ]}
              >
                Delete Forever
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderDeletingStep = () => (
    <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.rose} />
        <Text style={styles.loadingText}>Deleting your account...</Text>
        <Text style={styles.loadingSubtext}>
          This may take a moment. Please don't close the app.
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerButton} />
          <Text style={styles.title}>Delete Account</Text>
          <Pressable
            onPress={handleClose}
            style={styles.headerButton}
            disabled={step === 'deleting'}
          >
            <Text
              style={[
                styles.closeButton,
                step === 'deleting' && styles.closeButtonDisabled,
              ]}
            >
              Cancel
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        {step === 'warning' && renderWarningStep()}
        {step === 'confirm' && renderConfirmStep()}
        {step === 'deleting' && renderDeletingStep()}
      </View>
    </Modal>
  );
}

function BulletPoint({ text }: { text: string }) {
  return (
    <View style={styles.bulletItem}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    minWidth: 60,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  closeButton: {
    ...typography.body,
    color: colors.rose,
    fontWeight: '500',
    textAlign: 'right',
  },
  closeButtonDisabled: {
    color: colors.muted,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  warningIcon: {
    fontSize: 56,
  },
  heading: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  confirmWord: {
    fontWeight: '700',
    color: colors.error,
  },
  bulletList: {
    marginBottom: spacing.lg,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  bullet: {
    ...typography.body,
    color: colors.error,
    marginRight: spacing.sm,
  },
  bulletText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  warningText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: spacing.xl,
  },
  confirmInput: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    textAlign: 'center',
    fontSize: 18,
    letterSpacing: 2,
    marginBottom: spacing.xl,
  },
  confirmInputValid: {
    borderColor: colors.error,
    backgroundColor: colors.cream,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 'auto',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  dangerButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  dangerButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  dangerButtonText: {
    ...typography.body,
    color: colors.textInverse,
    fontWeight: '600',
  },
  dangerButtonTextDisabled: {
    color: colors.muted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.h4,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  loadingSubtext: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
