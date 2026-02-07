import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useBlockedUsers, useUnblockUser } from '../hooks';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';

interface BlockedUsersModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BlockedUsersModal({ visible, onClose }: BlockedUsersModalProps) {
  const insets = useSafeAreaInsets();
  const { data: blockedUsers, isLoading } = useBlockedUsers();
  const unblockUser = useUnblockUser();

  const handleUnblock = (userId: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${name}? They will be able to see your profile again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: () => {
            unblockUser.mutate(userId, {
              onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              },
            });
          },
        },
      ]
    );
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🚫</Text>
      <Text style={styles.emptyTitle}>No blocked users</Text>
      <Text style={styles.emptySubtitle}>
        Users you block won't be able to see your profile or send you messages.
      </Text>
    </View>
  );

  const renderBlockedUser = ({ item }: { item: any }) => (
    <View style={styles.userItem}>
      <Image
        source={{ uri: item.photo_url }}
        style={styles.userPhoto}
        contentFit="cover"
        placeholderContentFit="cover"
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.first_name}</Text>
        <Text style={styles.blockedDate}>
          Blocked {formatDate(item.blocked_at)}
        </Text>
      </View>
      <Pressable
        style={styles.unblockButton}
        onPress={() => handleUnblock(item.user_id, item.first_name)}
        disabled={unblockUser.isPending}
      >
        <Text style={styles.unblockButtonText}>
          {unblockUser.isPending ? 'Unblocking...' : 'Unblock'}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerButton} />
          <Text style={styles.title}>Blocked Users</Text>
          <Pressable onPress={handleClose} style={styles.headerButton}>
            <Text style={styles.doneButton}>Done</Text>
          </Pressable>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : blockedUsers && blockedUsers.length > 0 ? (
          <FlatList
            data={blockedUsers}
            keyExtractor={(item) => item.user_id}
            renderItem={renderBlockedUser}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </Modal>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'today';
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
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
  doneButton: {
    ...typography.body,
    color: colors.rose,
    fontWeight: '500',
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.muted,
  },
  listContent: {
    paddingVertical: spacing.md,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  userPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.lightGray,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  blockedDate: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xxs,
  },
  unblockButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unblockButtonText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 48 + spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
