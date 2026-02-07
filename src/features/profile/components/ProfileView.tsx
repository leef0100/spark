import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useMyProfile } from '../hooks';
import { ProfileSkeleton } from './ProfileSkeleton';
import { Button } from '../../../components/ui/Button';
import { colors } from '../../../theme/colors';
import { typography, fonts } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_HEIGHT = SCREEN_WIDTH * (5 / 4);

export function ProfileView() {
  const router = useRouter();
  const { data: profile, isLoading, isRefetching, refetch } = useMyProfile();

  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/profile/edit');
  };

  const handleSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/profile/settings');
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load profile</Text>
        <Button title="Retry" onPress={() => refetch()} variant="secondary" />
      </View>
    );
  }

  // Profile completeness
  const completenessItems = [
    { label: 'Photos', done: profile.photos.length >= 2 },
    { label: 'Prompts', done: profile.prompts.length >= 3 },
    { label: 'Job', done: !!profile.job_title },
    { label: 'Education', done: !!profile.education },
    { label: 'Bio', done: !!profile.bio },
  ];
  const completedCount = completenessItems.filter((i) => i.done).length;
  const completenessPercent = Math.round((completedCount / completenessItems.length) * 100);
  const isComplete = completenessPercent === 100;

  // Paused banner
  const isPaused = !profile.is_active;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          tintColor={colors.rose}
        />
      }
    >
      {/* Paused Banner */}
      {isPaused && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.pausedBanner}>
          <Text style={styles.pausedIcon}>⏸️</Text>
          <Text style={styles.pausedText}>Your profile is hidden from discovery</Text>
        </Animated.View>
      )}

      {/* Header Actions */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Pressable onPress={handleSettings} style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </Pressable>
        <Button
          title="Edit Profile"
          onPress={handleEditProfile}
          variant="secondary"
          size="small"
        />
      </Animated.View>

      {/* Completeness Indicator */}
      {!isComplete && (
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.completenessCard}>
          <View style={styles.completenessHeader}>
            <Text style={styles.completenessTitle}>Profile Completeness</Text>
            <Text style={styles.completenessPercent}>{completenessPercent}%</Text>
          </View>
          <View style={styles.completenessBar}>
            <View style={[styles.completenessProgress, { width: `${completenessPercent}%` }]} />
          </View>
          <View style={styles.completenessItems}>
            {completenessItems.filter((i) => !i.done).map((item, index) => (
              <View key={index} style={styles.completenessItem}>
                <Text style={styles.completenessItemDot}>○</Text>
                <Text style={styles.completenessItemText}>Add {item.label.toLowerCase()}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Profile Preview Card */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.previewCard}>
        <Text style={styles.previewLabel}>Preview</Text>

        {/* Photos and Prompts */}
        {profile.photos.map((photo, index) => (
          <View key={photo.id}>
            {/* Photo */}
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: photo.url }}
                style={styles.photo}
                contentFit="cover"
                transition={200}
              />
              {index === 0 && (
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.nameOverlay}
                >
                  <Text style={styles.name}>
                    {profile.first_name}, {profile.age}
                  </Text>
                  {profile.city && (
                    <View style={styles.locationRow}>
                      <Text style={styles.locationIcon}>📍</Text>
                      <Text style={styles.locationText}>{profile.city}</Text>
                    </View>
                  )}
                </LinearGradient>
              )}
            </View>

            {/* Prompt after photo */}
            {profile.prompts[index] && (
              <View style={styles.promptCard}>
                <Text style={styles.promptQuestion}>
                  {profile.prompts[index].prompt_text}
                </Text>
                <Text style={styles.promptAnswer}>
                  {profile.prompts[index].answer_text}
                </Text>
              </View>
            )}
          </View>
        ))}

        {/* Additional info */}
        {(profile.job_title || profile.education || profile.height_cm) && (
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>About</Text>
            <View style={styles.chipsContainer}>
              {profile.height_cm && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    {Math.floor(profile.height_cm / 30.48)}'{Math.round((profile.height_cm / 2.54) % 12)}"
                  </Text>
                </View>
              )}
              {profile.job_title && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{profile.job_title}</Text>
                </View>
              )}
              {profile.education && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{profile.education}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Bio */}
        {profile.bio && (
          <View style={styles.bioSection}>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  pausedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  pausedIcon: {
    fontSize: 16,
  },
  pausedText: {
    ...typography.bodySmall,
    color: colors.charcoal,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  settingsButton: {
    padding: spacing.sm,
  },
  settingsIcon: {
    fontSize: 24,
  },
  completenessCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  completenessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  completenessTitle: {
    ...typography.label,
    color: colors.textPrimary,
  },
  completenessPercent: {
    ...typography.h4,
    color: colors.rose,
  },
  completenessBar: {
    height: 6,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
    marginBottom: spacing.md,
  },
  completenessProgress: {
    height: '100%',
    backgroundColor: colors.rose,
    borderRadius: 3,
  },
  completenessItems: {
    gap: spacing.xs,
  },
  completenessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  completenessItemDot: {
    color: colors.muted,
    fontSize: 12,
  },
  completenessItemText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  previewCard: {
    marginHorizontal: spacing.lg,
  },
  previewLabel: {
    ...typography.labelSmall,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: PHOTO_HEIGHT * 0.6,
    backgroundColor: colors.cream,
  },
  nameOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 28,
    fontWeight: '700',
    color: colors.textInverse,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  locationIcon: {
    fontSize: 12,
  },
  locationText: {
    ...typography.bodySmall,
    color: colors.textInverse,
    opacity: 0.9,
  },
  promptCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  promptQuestion: {
    ...typography.labelSmall,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  promptAnswer: {
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 26,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  infoSection: {
    paddingVertical: spacing.md,
  },
  infoTitle: {
    ...typography.labelSmall,
    color: colors.muted,
    marginBottom: spacing.sm,
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
    paddingVertical: spacing.md,
  },
  bioText: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
