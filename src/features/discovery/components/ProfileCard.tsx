import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { DiscoveryProfile } from '../services/discoveryService';
import { colors } from '../../../theme/colors';
import { typography, fonts } from '../../../theme/typography';
import { spacing, borderRadius, layout } from '../../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_HEIGHT = SCREEN_WIDTH * (5 / 4); // 4:5 aspect ratio

interface ProfileCardProps {
  profile: DiscoveryProfile;
  onLikePhoto?: (photoId: string) => void;
  onLikePrompt?: (promptId: string) => void;
  onCommentPhoto?: (photoId: string) => void;
  onCommentPrompt?: (promptId: string) => void;
}

export function ProfileCard({
  profile,
  onLikePhoto,
  onLikePrompt,
  onCommentPhoto,
  onCommentPrompt,
}: ProfileCardProps) {
  // Calculate age from birth_date
  const age = useMemo(() => {
    if (profile.age) return profile.age;
    const birthDate = new Date(profile.birth_date);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    return calculatedAge;
  }, [profile.birth_date, profile.age]);

  // Build interleaved content (photo, prompt, photo, prompt, etc.)
  const contentSections = useMemo(() => {
    const sections: Array<
      | { type: 'photo'; data: typeof profile.photos[0]; index: number }
      | { type: 'prompt'; data: typeof profile.prompts[0]; index: number }
    > = [];

    const maxItems = Math.max(profile.photos.length, profile.prompts.length);

    for (let i = 0; i < maxItems; i++) {
      if (profile.photos[i]) {
        sections.push({ type: 'photo', data: profile.photos[i], index: i });
      }
      if (profile.prompts[i]) {
        sections.push({ type: 'prompt', data: profile.prompts[i], index: i });
      }
    }

    return sections;
  }, [profile.photos, profile.prompts]);

  const handleLikePhoto = (photoId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLikePhoto?.(photoId);
  };

  const handleLikePrompt = (promptId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLikePrompt?.(promptId);
  };

  const handleCommentPhoto = (photoId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCommentPhoto?.(photoId);
  };

  const handleCommentPrompt = (promptId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCommentPrompt?.(promptId);
  };

  // Format distance
  const distanceText = profile.distance_km
    ? profile.distance_km < 1
      ? 'Less than 1 km away'
      : `${Math.round(profile.distance_km)} km away`
    : null;

  // Additional info chips
  const infoChips: string[] = [];
  if (profile.height_cm) {
    const feet = Math.floor(profile.height_cm / 30.48);
    const inches = Math.round((profile.height_cm / 2.54) % 12);
    infoChips.push(`${feet}'${inches}"`);
  }
  if (profile.job_title) {
    infoChips.push(profile.job_title);
  }
  if (profile.company) {
    infoChips.push(profile.company);
  }
  if (profile.education) {
    infoChips.push(profile.education);
  }

  return (
    <View style={styles.container}>
      {contentSections.map((section, index) => {
        if (section.type === 'photo') {
          const isFirstPhoto = section.index === 0;

          return (
            <Animated.View
              key={`photo-${section.data.id}`}
              entering={FadeIn.delay(index * 100).duration(300)}
              style={styles.photoSection}
            >
              <Image
                source={{ uri: section.data.url }}
                style={styles.photo}
                contentFit="cover"
                transition={200}
              />

              {/* Name overlay on first photo */}
              {isFirstPhoto && (
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.nameOverlay}
                >
                  <View style={styles.nameContainer}>
                    <Text style={styles.name}>
                      {profile.first_name}, {age}
                    </Text>
                    {(profile.city || distanceText) && (
                      <View style={styles.locationRow}>
                        <Text style={styles.locationIcon}>📍</Text>
                        <Text style={styles.locationText}>
                          {profile.city}
                          {profile.city && distanceText && ' · '}
                          {distanceText}
                        </Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              )}

              {/* Action buttons */}
              <View style={styles.photoActions}>
                <ActionButton
                  icon="♡"
                  onPress={() => handleLikePhoto(section.data.id)}
                />
                <ActionButton
                  icon="💬"
                  onPress={() => handleCommentPhoto(section.data.id)}
                  style={styles.commentButton}
                />
              </View>
            </Animated.View>
          );
        }

        // Prompt section
        return (
          <Animated.View
            key={`prompt-${section.data.id}`}
            entering={FadeInUp.delay(index * 100).duration(300)}
            style={styles.promptSection}
          >
            <Text style={styles.promptQuestion}>{section.data.prompt_text}</Text>
            <Text style={styles.promptAnswer}>{section.data.answer_text}</Text>

            {/* Action buttons */}
            <View style={styles.promptActions}>
              <ActionButton
                icon="♡"
                onPress={() => handleLikePrompt(section.data.id)}
                size="small"
              />
              <ActionButton
                icon="💬"
                onPress={() => handleCommentPrompt(section.data.id)}
                size="small"
                style={styles.commentButton}
              />
            </View>
          </Animated.View>
        );
      })}

      {/* Additional info chips */}
      {infoChips.length > 0 && (
        <Animated.View
          entering={FadeInUp.delay(contentSections.length * 100).duration(300)}
          style={styles.infoSection}
        >
          <Text style={styles.infoTitle}>About</Text>
          <View style={styles.chipsContainer}>
            {infoChips.map((chip, index) => (
              <View key={index} style={styles.chip}>
                <Text style={styles.chipText}>{chip}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Bio if available */}
      {profile.bio && (
        <Animated.View
          entering={FadeInUp.delay((contentSections.length + 1) * 100).duration(300)}
          style={styles.bioSection}
        >
          <Text style={styles.bioText}>{profile.bio}</Text>
        </Animated.View>
      )}

      {/* Bottom spacing for scroll */}
      <View style={styles.bottomSpacer} />
    </View>
  );
}

interface ActionButtonProps {
  icon: string;
  onPress: () => void;
  size?: 'small' | 'medium';
  style?: object;
}

function ActionButton({ icon, onPress, size = 'medium', style }: ActionButtonProps) {
  const buttonSize = size === 'small' ? 36 : 44;
  const iconSize = size === 'small' ? 16 : 20;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { width: buttonSize, height: buttonSize },
        pressed && styles.actionButtonPressed,
        style,
      ]}
    >
      <Text style={[styles.actionIcon, { fontSize: iconSize }]}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  photoSection: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  photo: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    backgroundColor: colors.cream,
  },
  nameOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  nameContainer: {
    gap: spacing.xs,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 32,
    fontWeight: '700',
    color: colors.textInverse,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationIcon: {
    fontSize: 14,
  },
  locationText: {
    ...typography.body,
    color: colors.textInverse,
    opacity: 0.9,
  },
  photoActions: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  promptSection: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    position: 'relative',
  },
  promptQuestion: {
    ...typography.labelSmall,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  promptAnswer: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 30,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  promptActions: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  actionIcon: {
    color: colors.rose,
  },
  commentButton: {
    backgroundColor: colors.rose,
  },
  infoSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  infoTitle: {
    ...typography.labelSmall,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  bioSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  bioText: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: spacing.xxxl + layout.tabBarHeight,
  },
});
