import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { NewMatchesRow } from './NewMatchesRow';
import { ConversationItem } from './ConversationItem';
import { EmptyMatches } from './EmptyMatches';
import { MatchesSkeleton } from './MatchesSkeleton';
import { useMatches } from '../../matching/hooks';
import { MatchWithDetails } from '../../matching/services/matchingService';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

export function MatchesList() {
  const router = useRouter();
  const { data: matches, isLoading, isRefetching, refetch } = useMatches();

  // Separate new matches (no messages) from conversations
  const { newMatches, conversations } = useMemo(() => {
    if (!matches) return { newMatches: [], conversations: [] };

    const newMatchesList: MatchWithDetails[] = [];
    const conversationsList: MatchWithDetails[] = [];

    matches.forEach((match) => {
      if (!match.hasMessages) {
        newMatchesList.push(match);
      } else {
        conversationsList.push(match);
      }
    });

    // Sort new matches by expiry (most urgent first)
    newMatchesList.sort((a, b) => {
      if (!a.expiresAt) return 1;
      if (!b.expiresAt) return -1;
      return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
    });

    // Sort conversations by last message (most recent first)
    conversationsList.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return (
        new Date(b.lastMessage.created_at).getTime() -
        new Date(a.lastMessage.created_at).getTime()
      );
    });

    return { newMatches: newMatchesList, conversations: conversationsList };
  }, [matches]);

  const handleMatchPress = useCallback(
    (match: MatchWithDetails) => {
      router.push({
        pathname: '/(tabs)/matches/chat/[matchId]',
        params: {
          matchId: match.matchId,
          userId: match.otherUser.id,
          name: match.otherUser.first_name,
          photo: match.otherUser.photos[0]?.url || '',
          expiresAt: match.expiresAt || '',
          hasMessages: match.hasMessages ? '1' : '0',
        },
      });
    },
    [router]
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return <MatchesSkeleton />;
  }

  if (!matches || matches.length === 0) {
    return <EmptyMatches />;
  }

  const renderConversation = ({ item, index }: { item: MatchWithDetails; index: number }) => (
    <ConversationItem
      match={item}
      onPress={() => handleMatchPress(item)}
      index={index}
    />
  );

  const ListHeader = () => (
    <>
      {/* New Matches Row */}
      <NewMatchesRow matches={newMatches} onMatchPress={handleMatchPress} />

      {/* Messages Section Header */}
      {conversations.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Messages</Text>
        </Animated.View>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text style={styles.title}>Matches</Text>
      </Animated.View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.matchId}
        renderItem={renderConversation}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          newMatches.length > 0 ? (
            <View style={styles.emptyConversations}>
              <Text style={styles.emptyText}>
                No messages yet. Start a conversation!
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.rose}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    ...typography.labelSmall,
    color: colors.muted,
  },
  emptyConversations: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
  },
});
