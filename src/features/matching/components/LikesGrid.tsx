import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LikeCard } from './LikeCard';
import { LikeDetailModal } from './LikeDetailModal';
import { MatchCelebration } from './MatchCelebration';
import { EmptyLikes } from './EmptyLikes';
import { LikesSkeleton } from './LikesSkeleton';
import { useLikesReceived, useAcceptLike, useDeclineLike } from '../hooks';
import { LikeReceived } from '../services/matchingService';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

export function LikesGrid() {
  const [selectedLike, setSelectedLike] = useState<LikeReceived | null>(null);
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<LikeReceived['likerProfile'] | null>(null);

  const { data: likes, isLoading, isRefetching, refetch } = useLikesReceived();
  const acceptLike = useAcceptLike();
  const declineLike = useDeclineLike();

  const handleCardPress = useCallback((like: LikeReceived) => {
    setSelectedLike(like);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedLike(null);
  }, []);

  const handleAccept = useCallback(
    (like: LikeReceived) => {
      acceptLike.mutate(like.likerProfile.id, {
        onSuccess: () => {
          setSelectedLike(null);
          setMatchedProfile(like.likerProfile);
          setShowMatchCelebration(true);
        },
      });
    },
    [acceptLike]
  );

  const handleDecline = useCallback(
    (like: LikeReceived) => {
      declineLike.mutate(like.likerProfile.id, {
        onSuccess: () => {
          setSelectedLike(null);
        },
      });
    },
    [declineLike]
  );

  const handleCloseMatchCelebration = useCallback(() => {
    setShowMatchCelebration(false);
    setMatchedProfile(null);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return <LikesSkeleton />;
  }

  if (!likes || likes.length === 0) {
    return <EmptyLikes />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.rose}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.title}>Likes You</Text>
          <Text style={styles.subtitle}>
            {likes.length} {likes.length === 1 ? 'person' : 'people'} liked your profile
          </Text>
        </Animated.View>

        {/* Grid */}
        <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.grid}>
          {likes.map((like, index) => (
            <LikeCard
              key={like.interactionId}
              like={like}
              onPress={() => handleCardPress(like)}
              index={index}
            />
          ))}
        </Animated.View>
      </ScrollView>

      {/* Detail Modal */}
      <LikeDetailModal
        visible={!!selectedLike}
        like={selectedLike}
        onClose={handleCloseDetail}
        onAccept={() => selectedLike && handleAccept(selectedLike)}
        onDecline={() => selectedLike && handleDecline(selectedLike)}
        isAccepting={acceptLike.isPending}
        isDeclining={declineLike.isPending}
      />

      {/* Match Celebration */}
      <MatchCelebration
        visible={showMatchCelebration}
        matchedProfile={matchedProfile}
        onClose={handleCloseMatchCelebration}
        onSendMessage={() => {
          handleCloseMatchCelebration();
          // TODO: Navigate to chat
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
