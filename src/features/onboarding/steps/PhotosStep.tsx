import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Alert } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '../../../stores/onboardingStore';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';
import { LIMITS } from '../../../lib/constants';

const PHOTO_SLOTS = Array.from({ length: LIMITS.MAX_PHOTOS }, (_, i) => i);

export function PhotosStep() {
  const { photos, addPhoto, removePhoto } = useOnboardingStore();

  const getPhotoAtPosition = (position: number) =>
    photos.find((p) => p.position === position);

  const handlePickImage = async (position: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to add photos.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      addPhoto({
        uri: result.assets[0].uri,
        position,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleRemovePhoto = (position: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Remove Photo', 'Are you sure you want to remove this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removePhoto(position),
      },
    ]);
  };

  const photoCount = photos.length;
  const isValid = photoCount >= LIMITS.MIN_PHOTOS;

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Text style={styles.title}>Add your photos</Text>
        <Text style={styles.subtitle}>
          Add at least {LIMITS.MIN_PHOTOS} photos to continue
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.grid}>
        {PHOTO_SLOTS.map((position, index) => {
          const photo = getPhotoAtPosition(position);
          const isFirst = position === 0;

          return (
            <Animated.View
              key={position}
              entering={FadeIn.delay(250 + index * 50).duration(300)}
              style={[styles.slot, isFirst && styles.slotLarge]}
            >
              {photo ? (
                <Pressable
                  onPress={() => handleRemovePhoto(position)}
                  style={styles.photoContainer}
                >
                  <Image source={{ uri: photo.uri }} style={styles.photo} />
                  <View style={styles.removeButton}>
                    <Text style={styles.removeIcon}>✕</Text>
                  </View>
                  {isFirst && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryText}>Main</Text>
                    </View>
                  )}
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => handlePickImage(position)}
                  style={styles.emptySlot}
                >
                  <Text style={styles.addIcon}>+</Text>
                  {isFirst && (
                    <Text style={styles.addLabel}>Add main photo</Text>
                  )}
                </Pressable>
              )}
            </Animated.View>
          );
        })}
      </Animated.View>

      <Animated.View entering={FadeIn.delay(500).duration(400)} style={styles.footer}>
        <View style={styles.countContainer}>
          <Text style={[styles.countText, isValid && styles.countTextValid]}>
            {photoCount}/{LIMITS.MIN_PHOTOS} required photos
          </Text>
          {isValid && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.hint}>
          Tip: Photos showing your face clearly get more likes
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  slot: {
    width: '31%',
    aspectRatio: 4 / 5,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  slotLarge: {
    width: '64%',
  },
  emptySlot: {
    flex: 1,
    backgroundColor: colors.cream,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 32,
    color: colors.muted,
    fontWeight: '300',
  },
  addLabel: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  photoContainer: {
    flex: 1,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.lg,
  },
  removeButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.rose,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  primaryText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '600',
  },
  footer: {
    marginTop: spacing.xl,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  countText: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
  },
  countTextValid: {
    color: colors.success,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: colors.success,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
