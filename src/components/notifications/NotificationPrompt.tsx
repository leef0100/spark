import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useNotificationPermission } from '../../services/notifications';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface NotificationPromptProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NotificationPrompt({
  visible,
  onClose,
  onSuccess,
}: NotificationPromptProps) {
  const insets = useSafeAreaInsets();
  const { isGranted, isDenied, isRequesting, requestPermission } = useNotificationPermission();

  const handleEnable = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isDenied) {
      // If denied, open settings
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
      return;
    }

    const granted = await requestPermission();
    if (granted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess?.();
      onClose();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  if (isGranted) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
        <Animated.View
          entering={SlideInUp.duration(400).springify()}
          style={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}
        >
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Text style={styles.illustration}>🔔</Text>
          </View>

          {/* Content */}
          <Text style={styles.title}>Stay Connected</Text>
          <Text style={styles.description}>
            Get notified when you have new matches, messages, and likes. Don't miss out on potential connections!
          </Text>

          {/* Features */}
          <View style={styles.features}>
            <FeatureItem icon="💕" text="New match alerts" />
            <FeatureItem icon="💬" text="Message notifications" />
            <FeatureItem icon="❤️" text="Like notifications" />
            <FeatureItem icon="⏰" text="Match expiry reminders" />
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Pressable
              style={styles.enableButton}
              onPress={handleEnable}
              disabled={isRequesting}
            >
              <Text style={styles.enableButtonText}>
                {isRequesting
                  ? 'Enabling...'
                  : isDenied
                  ? 'Open Settings'
                  : 'Enable Notifications'}
              </Text>
            </Pressable>

            <Pressable style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Maybe Later</Text>
            </Pressable>
          </View>

          {isDenied && (
            <Text style={styles.deniedNote}>
              You previously denied notifications. Please enable them in Settings.
            </Text>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  illustration: {
    fontSize: 64,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  features: {
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: spacing.md,
    width: 28,
    textAlign: 'center',
  },
  featureText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  buttons: {
    gap: spacing.md,
  },
  enableButton: {
    backgroundColor: colors.rose,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  enableButtonText: {
    ...typography.body,
    color: colors.textInverse,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  skipButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  deniedNote: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
