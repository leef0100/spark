import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useUnmatch, useBlockUser } from '../../matching/hooks';
import { OnlineBadge } from '../../../components/presence/OnlineIndicator';
import { TypingIndicatorInline } from '../../../components/presence/TypingIndicator';
import { useUserPresence, formatLastSeen } from '../../../services/presence';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';

interface ChatHeaderProps {
  matchId: string;
  userId: string;
  name: string;
  photoUrl?: string;
  isTyping?: boolean;
}

export function ChatHeader({ matchId, userId, name, photoUrl, isTyping = false }: ChatHeaderProps) {
  const { status, lastSeen, isOnline } = useUserPresence(userId);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const unmatch = useUnmatch();
  const blockUser = useBlockUser();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleMenuPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMenu(true);
  };

  const handleUnmatch = () => {
    setShowMenu(false);
    Alert.alert(
      'Unmatch',
      `Are you sure you want to unmatch with ${name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unmatch',
          style: 'destructive',
          onPress: () => {
            unmatch.mutate(matchId, {
              onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.back();
              },
            });
          },
        },
      ]
    );
  };

  const handleBlock = () => {
    setShowMenu(false);
    setShowBlockConfirm(true);
  };

  const confirmBlock = () => {
    setShowBlockConfirm(false);
    blockUser.mutate(
      { userId, matchId },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        },
      }
    );
  };

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>

        <Pressable style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            {photoUrl && (
              <Image
                source={{ uri: photoUrl }}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
              />
            )}
            <OnlineBadge userId={userId} size="small" />
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{name}</Text>
            {isTyping ? (
              <TypingIndicatorInline />
            ) : (
              <Text style={styles.status}>
                {isOnline ? 'Online' : formatLastSeen(lastSeen)}
              </Text>
            )}
          </View>
        </Pressable>

        <Pressable onPress={handleMenuPress} style={styles.menuButton}>
          <Text style={styles.menuIcon}>⋯</Text>
        </Pressable>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setShowMenu(false)}
        >
          <Animated.View
            entering={SlideInUp.springify().damping(15)}
            style={styles.menuContainer}
          >
            <Pressable
              style={styles.menuItem}
              onPress={handleUnmatch}
            >
              <Text style={styles.menuItemText}>Unmatch</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              style={styles.menuItem}
              onPress={handleBlock}
            >
              <Text style={[styles.menuItemText, styles.menuItemDestructive]}>
                Block & Report
              </Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              style={styles.menuItem}
              onPress={() => setShowMenu(false)}
            >
              <Text style={[styles.menuItemText, styles.menuItemCancel]}>
                Cancel
              </Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Block Confirmation Modal */}
      <Modal
        visible={showBlockConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBlockConfirm(false)}
      >
        <View style={styles.overlay}>
          <Animated.View
            entering={FadeIn.duration(200)}
            style={styles.confirmContainer}
          >
            <Text style={styles.confirmTitle}>Block {name}?</Text>
            <Text style={styles.confirmMessage}>
              They won't be able to find your profile or message you.
              You can unblock them later in Settings.
            </Text>
            <View style={styles.confirmButtons}>
              <Pressable
                style={[styles.confirmButton, styles.confirmButtonCancel]}
                onPress={() => setShowBlockConfirm(false)}
              >
                <Text style={styles.confirmButtonTextCancel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmButton, styles.confirmButtonBlock]}
                onPress={confirmBlock}
              >
                <Text style={styles.confirmButtonTextBlock}>Block</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cream,
  },
  nameContainer: {
    alignItems: 'center',
  },
  name: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  status: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 1,
  },
  menuButton: {
    padding: spacing.sm,
    marginRight: -spacing.sm,
  },
  menuIcon: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl,
  },
  menuItem: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  menuItemText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  menuItemDestructive: {
    color: colors.error,
  },
  menuItemCancel: {
    color: colors.muted,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  confirmContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xxxl,
  },
  confirmTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  confirmMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  confirmButtonCancel: {
    backgroundColor: colors.cream,
  },
  confirmButtonBlock: {
    backgroundColor: colors.error,
  },
  confirmButtonTextCancel: {
    ...typography.button,
    color: colors.textPrimary,
  },
  confirmButtonTextBlock: {
    ...typography.button,
    color: colors.textInverse,
  },
});
