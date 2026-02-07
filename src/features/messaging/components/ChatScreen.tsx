import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { MessageBubble, DateSeparator } from './MessageBubble';
import { ChatSkeleton } from './ChatSkeleton';
import { TypingIndicator } from '../../../components/presence/TypingIndicator';
import { ExpirationTimer } from '../../matching/components/ExpirationTimer';
import { useMessages, useSendMessage, useMarkMessagesAsRead } from '../hooks';
import { useTypingIndicator } from '../../../services/presence';
import { ChatMessage } from '../services/messagingService';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { isSameDay } from 'date-fns';

interface ChatScreenProps {
  matchId: string;
  userId: string;
  name: string;
  photoUrl?: string;
  expiresAt?: string;
  hasMessages: boolean;
}

interface MessageItem {
  type: 'message' | 'date';
  data: ChatMessage | string;
  showTimestamp?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

export function ChatScreen({
  matchId,
  userId,
  name,
  photoUrl,
  expiresAt,
  hasMessages: initialHasMessages,
}: ChatScreenProps) {
  const flatListRef = useRef<FlatList>(null);
  const { messages, isLoading, hasMore, loadMore, isLoadingMore } = useMessages(matchId);
  const sendMessage = useSendMessage(matchId);
  const markAsRead = useMarkMessagesAsRead(matchId);
  const { typingUsers, isAnyoneTyping, startTyping, stopTyping } = useTypingIndicator(matchId);

  // Handle typing callbacks
  const handleTypingStart = useCallback(() => {
    startTyping();
  }, [startTyping]);

  const handleTypingStop = useCallback(() => {
    stopTyping();
  }, [stopTyping]);

  // Mark messages as read when entering the chat
  useEffect(() => {
    markAsRead.mutate();
  }, []);

  // Check if conversation has started (for timer)
  const conversationStarted = messages.length > 0;

  // Process messages into items with date separators
  const items = useMemo(() => {
    const result: MessageItem[] = [];
    let lastDate: Date | null = null;
    let lastSenderId: string | null = null;

    messages.forEach((message, index) => {
      const messageDate = new Date(message.created_at);
      const nextMessage = messages[index + 1];
      const prevMessage = messages[index - 1];

      // Add date separator if needed
      if (!lastDate || !isSameDay(messageDate, lastDate)) {
        result.push({
          type: 'date',
          data: message.created_at,
        });
        lastDate = messageDate;
      }

      // Determine if this is first/last in a group of messages from same sender
      const isFirstInGroup = !prevMessage || prevMessage.sender_id !== message.sender_id ||
        !isSameDay(new Date(prevMessage.created_at), messageDate);
      const isLastInGroup = !nextMessage || nextMessage.sender_id !== message.sender_id ||
        !isSameDay(new Date(nextMessage.created_at), messageDate);

      // Show timestamp on last message in group
      const showTimestamp = isLastInGroup;

      result.push({
        type: 'message',
        data: message,
        showTimestamp,
        isFirstInGroup,
        isLastInGroup,
      });

      lastSenderId = message.sender_id;
    });

    return result;
  }, [messages]);

  const handleSend = (content: string) => {
    sendMessage.mutate(content);
    // Scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  };

  const renderItem = ({ item }: { item: MessageItem }) => {
    if (item.type === 'date') {
      return <DateSeparator date={item.data as string} />;
    }

    return (
      <MessageBubble
        message={item.data as ChatMessage}
        showTimestamp={item.showTimestamp}
        isFirstInGroup={item.isFirstInGroup}
        isLastInGroup={item.isLastInGroup}
      />
    );
  };

  const keyExtractor = (item: MessageItem, index: number) => {
    if (item.type === 'date') {
      return `date-${item.data}`;
    }
    return (item.data as ChatMessage).id;
  };

  const ListHeader = () => (
    <View style={styles.listHeader}>
      {/* Expiration banner for new matches */}
      {!conversationStarted && expiresAt && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.expirationBanner}>
          <ExpirationTimer
            expiresAt={expiresAt}
            hasMessages={conversationStarted}
            variant="banner"
          />
        </Animated.View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ChatHeader
          matchId={matchId}
          userId={userId}
          name={name}
          photoUrl={photoUrl}
          isTyping={isAnyoneTyping}
        />
        <ChatSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ChatHeader
        matchId={matchId}
        userId={userId}
        name={name}
        photoUrl={photoUrl}
        isTyping={isAnyoneTyping}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={isAnyoneTyping ? <TypingIndicator userName={name} /> : null}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          inverted={false}
          onContentSizeChange={() => {
            if (items.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />

        <ChatInput
          onSend={handleSend}
          disabled={sendMessage.isPending}
          placeholder={`Message ${name}...`}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing.md,
  },
  listHeader: {
    marginBottom: spacing.md,
  },
  expirationBanner: {
    marginHorizontal: spacing.lg,
  },
});
