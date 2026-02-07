import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  RefreshControl,
  ViewToken,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ProfileCard } from './ProfileCard';
import { DiscoveryActionBar } from './DiscoveryActionBar';
import { CommentSheet } from './CommentSheet';
import { EmptyFeed } from './EmptyFeed';
import { FeedSkeleton } from './FeedSkeleton';
import {
  useDiscoveryFeed,
  useLikeProfile,
  usePassProfile,
  useCommentOnProfile,
} from '../hooks/useDiscoveryFeed';
import { DiscoveryProfile } from '../services/discoveryService';
import { colors } from '../../../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CommentTarget {
  profileId: string;
  profileName: string;
  contentType: 'photo' | 'prompt';
  contentId: string;
  preview?: {
    imageUrl?: string;
    promptText?: string;
    answerText?: string;
  };
}

export function DiscoveryFeed() {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [commentTarget, setCommentTarget] = useState<CommentTarget | null>(null);
  const [showCommentSheet, setShowCommentSheet] = useState(false);

  const {
    data,
    isLoading,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useDiscoveryFeed();

  const likeProfile = useLikeProfile();
  const passProfile = usePassProfile();
  const commentOnProfile = useCommentOnProfile();

  // Flatten all pages into a single array of profiles
  const profiles = data?.pages.flatMap((page) => page.profiles) ?? [];
  const currentProfile = profiles[currentIndex];

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const goToNextProfile = useCallback(() => {
    if (currentIndex < profiles.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  }, [currentIndex, profiles.length]);

  const handleLike = useCallback(() => {
    if (!currentProfile) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    likeProfile.mutate(currentProfile.profile_id, {
      onSuccess: (result) => {
        if (result.isMatch) {
          // TODO: Show match animation
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        goToNextProfile();
      },
    });
  }, [currentProfile, likeProfile, goToNextProfile]);

  const handlePass = useCallback(() => {
    if (!currentProfile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    passProfile.mutate(currentProfile.profile_id, {
      onSuccess: () => {
        goToNextProfile();
      },
    });
  }, [currentProfile, passProfile, goToNextProfile]);

  const handleOpenComment = useCallback(() => {
    if (!currentProfile) return;
    // Default to commenting on first photo or first prompt
    const firstPhoto = currentProfile.photos[0];
    const firstPrompt = currentProfile.prompts[0];

    if (firstPrompt) {
      setCommentTarget({
        profileId: currentProfile.profile_id,
        profileName: currentProfile.first_name,
        contentType: 'prompt',
        contentId: firstPrompt.id,
        preview: {
          promptText: firstPrompt.prompt_text,
          answerText: firstPrompt.answer_text,
        },
      });
    } else if (firstPhoto) {
      setCommentTarget({
        profileId: currentProfile.profile_id,
        profileName: currentProfile.first_name,
        contentType: 'photo',
        contentId: firstPhoto.id,
        preview: {
          imageUrl: firstPhoto.url,
        },
      });
    }
    setShowCommentSheet(true);
  }, [currentProfile]);

  const handleCommentOnPhoto = useCallback(
    (photoId: string) => {
      if (!currentProfile) return;
      const photo = currentProfile.photos.find((p) => p.id === photoId);
      setCommentTarget({
        profileId: currentProfile.profile_id,
        profileName: currentProfile.first_name,
        contentType: 'photo',
        contentId: photoId,
        preview: {
          imageUrl: photo?.url,
        },
      });
      setShowCommentSheet(true);
    },
    [currentProfile]
  );

  const handleCommentOnPrompt = useCallback(
    (promptId: string) => {
      if (!currentProfile) return;
      const prompt = currentProfile.prompts.find((p) => p.id === promptId);
      setCommentTarget({
        profileId: currentProfile.profile_id,
        profileName: currentProfile.first_name,
        contentType: 'prompt',
        contentId: promptId,
        preview: {
          promptText: prompt?.prompt_text,
          answerText: prompt?.answer_text,
        },
      });
      setShowCommentSheet(true);
    },
    [currentProfile]
  );

  const handleLikePhoto = useCallback(
    (photoId: string) => {
      if (!currentProfile) return;
      // For now, liking a photo just likes the profile
      handleLike();
    },
    [currentProfile, handleLike]
  );

  const handleLikePrompt = useCallback(
    (promptId: string) => {
      if (!currentProfile) return;
      // For now, liking a prompt just likes the profile
      handleLike();
    },
    [currentProfile, handleLike]
  );

  const handleSubmitComment = useCallback(
    (comment: string) => {
      if (!commentTarget) return;

      commentOnProfile.mutate(
        {
          targetId: commentTarget.profileId,
          comment,
          contentType: commentTarget.contentType,
          contentId: commentTarget.contentId,
        },
        {
          onSuccess: (result) => {
            setShowCommentSheet(false);
            setCommentTarget(null);
            if (result.isMatch) {
              // TODO: Show match animation
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            goToNextProfile();
          },
        }
      );
    },
    [commentTarget, commentOnProfile, goToNextProfile]
  );

  const handleCloseComment = useCallback(() => {
    setShowCommentSheet(false);
    setCommentTarget(null);
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderProfile = useCallback(
    ({ item }: { item: DiscoveryProfile }) => (
      <View style={styles.profileContainer}>
        <ProfileCard
          profile={item}
          onLikePhoto={handleLikePhoto}
          onLikePrompt={handleLikePrompt}
          onCommentPhoto={handleCommentOnPhoto}
          onCommentPrompt={handleCommentOnPrompt}
        />
      </View>
    ),
    [handleLikePhoto, handleLikePrompt, handleCommentOnPhoto, handleCommentOnPrompt]
  );

  if (isLoading) {
    return <FeedSkeleton />;
  }

  if (profiles.length === 0) {
    return <EmptyFeed onRefresh={handleRefresh} />;
  }

  const isActionDisabled =
    likeProfile.isPending || passProfile.isPending || commentOnProfile.isPending;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={profiles}
        keyExtractor={(item) => item.profile_id}
        renderItem={renderProfile}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.rose}
          />
        }
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />

      <DiscoveryActionBar
        onPass={handlePass}
        onLike={handleLike}
        onComment={handleOpenComment}
        disabled={isActionDisabled}
      />

      <CommentSheet
        visible={showCommentSheet}
        onClose={handleCloseComment}
        onSubmit={handleSubmitComment}
        contentType={commentTarget?.contentType ?? 'prompt'}
        contentPreview={commentTarget?.preview}
        recipientName={commentTarget?.profileName ?? ''}
        isSubmitting={commentOnProfile.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileContainer: {
    height: SCREEN_HEIGHT,
  },
});
