import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp, SlideInRight, SlideInLeft } from 'react-native-reanimated';
import { format, isToday, isYesterday } from 'date-fns';
import { ChatMessage } from '../services/messagingService';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';

interface MessageBubbleProps {
  message: ChatMessage;
  showTimestamp?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

export function MessageBubble({
  message,
  showTimestamp = false,
  isFirstInGroup = true,
  isLastInGroup = true,
}: MessageBubbleProps) {
  const { content, isOwn, created_at, read_at } = message;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };

  const enteringAnimation = isOwn
    ? SlideInRight.springify().damping(15).stiffness(150)
    : SlideInLeft.springify().damping(15).stiffness(150);

  return (
    <Animated.View
      entering={enteringAnimation}
      style={[
        styles.container,
        isOwn ? styles.containerOwn : styles.containerOther,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
          !isFirstInGroup && (isOwn ? styles.bubbleNotFirstOwn : styles.bubbleNotFirstOther),
          !isLastInGroup && (isOwn ? styles.bubbleNotLastOwn : styles.bubbleNotLastOther),
        ]}
      >
        <Text style={[styles.text, isOwn ? styles.textOwn : styles.textOther]}>
          {content}
        </Text>
      </View>

      {/* Timestamp and read receipt */}
      {showTimestamp && (
        <View style={[styles.meta, isOwn && styles.metaOwn]}>
          <Text style={styles.time}>{formatTime(created_at)}</Text>
          {isOwn && read_at && (
            <Text style={styles.readReceipt}>Read</Text>
          )}
        </View>
      )}
    </Animated.View>
  );
}

interface DateSeparatorProps {
  date: string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMMM d, yyyy');
  };

  return (
    <Animated.View entering={FadeInUp.duration(300)} style={styles.dateSeparator}>
      <Text style={styles.dateText}>{formatDate(date)}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  containerOwn: {
    alignItems: 'flex-end',
  },
  containerOther: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  bubbleOwn: {
    backgroundColor: colors.rose,
    borderBottomRightRadius: borderRadius.xs,
  },
  bubbleOther: {
    backgroundColor: colors.cream,
    borderBottomLeftRadius: borderRadius.xs,
  },
  bubbleNotFirstOwn: {
    borderTopRightRadius: borderRadius.sm,
  },
  bubbleNotFirstOther: {
    borderTopLeftRadius: borderRadius.sm,
  },
  bubbleNotLastOwn: {
    borderBottomRightRadius: borderRadius.lg,
  },
  bubbleNotLastOther: {
    borderBottomLeftRadius: borderRadius.lg,
  },
  text: {
    ...typography.body,
    lineHeight: 22,
  },
  textOwn: {
    color: colors.textInverse,
  },
  textOther: {
    color: colors.textPrimary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxs,
    gap: spacing.xs,
  },
  metaOwn: {
    flexDirection: 'row-reverse',
  },
  time: {
    ...typography.caption,
    color: colors.muted,
  },
  readReceipt: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '500',
  },
  dateSeparator: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  dateText: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '500',
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
});
