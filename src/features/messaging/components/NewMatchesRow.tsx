import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { MatchWithDetails } from '../../matching/services/matchingService';
import { ExpirationTimer } from '../../matching/components/ExpirationTimer';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';

const AVATAR_SIZE = 72;

interface NewMatchesRowProps {
  matches: MatchWithDetails[];
  onMatchPress: (match: MatchWithDetails) => void;
}

export function NewMatchesRow({ matches, onMatchPress }: NewMatchesRowProps) {
  if (matches.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>New Matches</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {matches.map((match, index) => (
          <MatchAvatar
            key={match.matchId}
            match={match}
            onPress={() => onMatchPress(match)}
            index={index}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface MatchAvatarProps {
  match: MatchWithDetails;
  onPress: () => void;
  index: number;
}

function MatchAvatar({ match, onPress, index }: MatchAvatarProps) {
  const { otherUser, expiresAt } = match;
  const primaryPhoto = otherUser.photos[0];

  // Check if urgent (< 12 hours)
  const isUrgent = expiresAt
    ? new Date(expiresAt).getTime() - Date.now() < 12 * 60 * 60 * 1000
    : false;

  // Pulsing animation for urgent matches
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);

  React.useEffect(() => {
    if (isUrgent) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [isUrgent]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View entering={FadeIn.delay(index * 100).duration(300)}>
      <Pressable onPress={handlePress} style={styles.avatarContainer}>
        {/* Pulsing ring for urgent matches */}
        {isUrgent && (
          <Animated.View style={[styles.pulseRing, pulseStyle]} />
        )}

        {/* Avatar */}
        <View style={[styles.avatarWrapper, isUrgent && styles.avatarUrgent]}>
          <Image
            source={{ uri: primaryPhoto?.url }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
        </View>

        {/* Name */}
        <Text style={styles.name} numberOfLines={1}>
          {otherUser.first_name}
        </Text>

        {/* Timer badge */}
        <View style={styles.timerContainer}>
          <ExpirationTimer
            expiresAt={expiresAt}
            hasMessages={false}
            variant="badge"
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.labelSmall,
    color: colors.muted,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  avatarContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    backgroundColor: colors.rose,
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.rose,
    overflow: 'hidden',
  },
  avatarUrgent: {
    borderWidth: 3,
    borderColor: colors.error,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  name: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '500',
    marginTop: spacing.xs,
    maxWidth: AVATAR_SIZE + spacing.md,
    textAlign: 'center',
  },
  timerContainer: {
    marginTop: spacing.xxs,
  },
});
