import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { LikeReceived } from '../services/matchingService';
import { Button } from '../../../components/ui/Button';
import { colors } from '../../../theme/colors';
import { typography, fonts } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PHOTO_HEIGHT = SCREEN_WIDTH * (5 / 4);

interface LikeDetailModalProps {
  visible: boolean;
  like: LikeReceived | null;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
  isAccepting: boolean;
  isDeclining: boolean;
}

export function LikeDetailModal({
  visible,
  like,
  onClose,
  onAccept,
  onDecline,
  isAccepting,
  isDeclining,
}: LikeDetailModalProps) {
  const insets = useSafeAreaInsets();

  if (!like) return null;

  const { likerProfile, commentText, likedContentType } = like;

  const handleAccept = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAccept();
  };

  const handleDecline = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDecline();
  };

  // Find liked content for context
  const getLikedContentText = () => {
    if (!likedContentType) return null;
    return likedContentType === 'photo' ? 'your photo' : 'your prompt';
  };

  const likedContentText = getLikedContentText();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>

        {/* Comment Banner */}
        {commentText && (
          <Animated.View entering={FadeIn.delay(200).duration(300)} style={styles.commentBanner}>
            <Text style={styles.commentLabel}>
              {likerProfile.first_name} commented on {likedContentText}:
            </Text>
            <Text style={styles.commentText}>"{commentText}"</Text>
          </Animated.View>
        )}

        {/* Profile Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Photos and Prompts interleaved */}
          {likerProfile.photos.map((photo, index) => (
            <View key={photo.id}>
              {/* Photo */}
              <Animated.View
                entering={SlideInDown.delay(index * 150).duration(400)}
                style={styles.photoContainer}
              >
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
                      {likerProfile.first_name}, {likerProfile.age}
                    </Text>
                  </LinearGradient>
                )}
              </Animated.View>

              {/* Prompt after photo */}
              {likerProfile.prompts[index] && (
                <Animated.View
                  entering={FadeIn.delay(index * 150 + 100).duration(300)}
                  style={styles.promptCard}
                >
                  <Text style={styles.promptQuestion}>
                    {likerProfile.prompts[index].prompt_text}
                  </Text>
                  <Text style={styles.promptAnswer}>
                    {likerProfile.prompts[index].answer_text}
                  </Text>
                </Animated.View>
              )}
            </View>
          ))}

          {/* Bottom spacing */}
          <View style={{ height: 160 }} />
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.actionButton}>
            <Button
              title="Pass"
              variant="secondary"
              onPress={handleDecline}
              loading={isDeclining}
              disabled={isAccepting || isDeclining}
              fullWidth
            />
          </View>
          <View style={styles.actionButton}>
            <Button
              title="Match"
              variant="primary"
              onPress={handleAccept}
              loading={isAccepting}
              disabled={isAccepting || isDeclining}
              fullWidth
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeText: {
    ...typography.body,
    color: colors.rose,
    fontWeight: '500',
  },
  commentBanner: {
    backgroundColor: colors.roseLight,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.rose,
  },
  commentLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  commentText: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  photoContainer: {
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
  name: {
    fontFamily: fonts.display,
    fontSize: 32,
    fontWeight: '700',
    color: colors.textInverse,
    letterSpacing: -0.5,
  },
  promptCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
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
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
