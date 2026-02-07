import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { formatDistanceToNow } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { MatchWithDetails } from '../../matching/services/matchingService';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';

const AVATAR_SIZE = 56;

interface ConversationItemProps {
  match: MatchWithDetails;
  onPress: () => void;
  index: number;
}

export function ConversationItem({ match, onPress, index }: ConversationItemProps) {
  const scale = useSharedValue(1);
  const { otherUser, lastMessage, unreadCount } = match;
  const primaryPhoto = otherUser.photos[0];
  const hasUnread = unreadCount > 0;

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Format timestamp
  const timeAgo = lastMessage
    ? formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: false })
    : '';

  // Format message preview
  const messagePreview = lastMessage
    ? lastMessage.sender_id === otherUser.id
      ? lastMessage.content
      : `You: ${lastMessage.content}`
    : 'Start a conversation';

  return (
    <Animated.View entering={FadeIn.delay(index * 50).duration(300)}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[styles.container, animatedStyle]}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: primaryPhoto?.url }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
            {hasUnread && <View style={styles.unreadDot} />}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.header}>
              <Text
                style={[styles.name, hasUnread && styles.nameUnread]}
                numberOfLines={1}
              >
                {otherUser.first_name}
              </Text>
              {timeAgo && (
                <Text style={styles.time}>{timeAgo}</Text>
              )}
            </View>
            <Text
              style={[styles.message, hasUnread && styles.messageUnread]}
              numberOfLines={1}
            >
              {messagePreview}
            </Text>
          </View>

          {/* Unread badge */}
          {hasUnread && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.cream,
  },
  unreadDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.rose,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  name: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  nameUnread: {
    fontWeight: '700',
  },
  time: {
    ...typography.caption,
    color: colors.muted,
    marginLeft: spacing.sm,
  },
  message: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  messageUnread: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: colors.rose,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    marginLeft: spacing.sm,
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
});
