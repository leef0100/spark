import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useMyProfile, useToggleProfileActive } from '../hooks';
import { PreferencesSection } from './PreferencesSection';
import { BlockedUsersModal } from './BlockedUsersModal';
import { DeleteAccountModal } from './DeleteAccountModal';
import { useAuthStore } from '../../../stores/authStore';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';

export function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: profile } = useMyProfile();
  const toggleActive = useToggleProfileActive();
  const signOut = useAuthStore((state) => state.signOut);

  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleTogglePause = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleActive.mutate(!value);
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await signOut();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  const isPaused = profile ? !profile.is_active : false;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Pause Profile */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Visibility</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Pause Profile</Text>
              <Text style={styles.settingDescription}>
                Hide your profile from discovery. You can still chat with existing matches.
              </Text>
            </View>
            <Switch
              value={isPaused}
              onValueChange={handleTogglePause}
              trackColor={{ false: colors.lightGray, true: colors.rose }}
              thumbColor={colors.surface}
            />
          </View>
        </Animated.View>

        {/* Discovery Preferences */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Discovery Preferences</Text>
          </View>
          <PreferencesSection />
        </Animated.View>

        {/* Privacy */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Privacy</Text>
          </View>
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowBlockedUsers(true);
            }}
          >
            <Text style={styles.menuItemText}>Blocked Users</Text>
            <Text style={styles.menuItemArrow}>→</Text>
          </Pressable>
        </Animated.View>

        {/* Legal */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Legal</Text>
          </View>
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuItemText}>Terms of Service</Text>
            <Text style={styles.menuItemArrow}>→</Text>
          </Pressable>
          <View style={styles.menuDivider} />
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuItemText}>Privacy Policy</Text>
            <Text style={styles.menuItemArrow}>→</Text>
          </Pressable>
        </Animated.View>

        {/* Account */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account</Text>
          </View>
          <Pressable style={styles.menuItem} onPress={handleLogout}>
            <Text style={styles.menuItemText}>Log Out</Text>
          </Pressable>
          <View style={styles.menuDivider} />
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowDeleteAccount(true);
            }}
          >
            <Text style={[styles.menuItemText, styles.menuItemDestructive]}>
              Delete Account
            </Text>
          </Pressable>
        </Animated.View>

        {/* Version */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.versionContainer}>
          <Text style={styles.versionText}>Spark v1.0.0</Text>
        </Animated.View>
      </ScrollView>

      {/* Modals */}
      <BlockedUsersModal
        visible={showBlockedUsers}
        onClose={() => setShowBlockedUsers(false)}
      />
      <DeleteAccountModal
        visible={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
      />
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
  backButton: {
    padding: spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    ...typography.labelSmall,
    color: colors.muted,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: spacing.xxs,
  },
  settingDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  menuItemText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  menuItemArrow: {
    ...typography.body,
    color: colors.muted,
  },
  menuItemDestructive: {
    color: colors.error,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  versionText: {
    ...typography.caption,
    color: colors.muted,
  },
});
