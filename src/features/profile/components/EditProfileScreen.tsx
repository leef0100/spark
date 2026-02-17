import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import {
  useMyProfile,
  useUpdateProfile,
  useUploadPhoto,
  useDeletePhoto,
} from '../hooks';
import { EditPromptsModal } from './EditPromptsModal';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';

const PHOTO_SLOTS = [0, 1, 2, 3, 4, 5];

export function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const uploadPhoto = useUploadPhoto();
  const deletePhoto = useDeletePhoto();

  const [showPromptsModal, setShowPromptsModal] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [localValues, setLocalValues] = useState({
    first_name: '',
    bio: '',
    job_title: '',
    company: '',
    education: '',
  });

  // Initialize local values from profile
  React.useEffect(() => {
    if (profile) {
      setLocalValues({
        first_name: profile.first_name || '',
        bio: profile.bio || '',
        job_title: profile.job_title || '',
        company: profile.company || '',
        education: profile.education || '',
      });
    }
  }, [profile]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleFieldChange = (field: string, value: string) => {
    setLocalValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleFieldBlur = (field: string) => {
    setEditingField(null);
    const currentValue = localValues[field as keyof typeof localValues];
    const profileValue = profile?.[field as keyof typeof profile];

    if (currentValue !== profileValue) {
      updateProfile.mutate({ [field]: currentValue || null });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handlePickPhoto = async (position: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const existingPhoto = profile?.photos.find((p) => p.position === position);

    if (existingPhoto) {
      Alert.alert(
        'Photo Options',
        '',
        [
          {
            text: 'Replace Photo',
            onPress: () => pickImage(position),
          },
          {
            text: 'Delete Photo',
            style: 'destructive',
            onPress: () => {
              deletePhoto.mutate(existingPhoto.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      pickImage(position);
    }
  };

  const pickImage = async (position: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadPhoto.mutate(
        { uri: result.assets[0].uri, position },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        }
      );
    }
  };

  const getPhotoAtPosition = (position: number) => {
    return profile?.photos.find((p) => p.position === position);
  };

  if (isLoading || !profile) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photos Grid */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.sectionSubtitle}>Add at least 2 photos</Text>
          <View style={styles.photosGrid}>
            {PHOTO_SLOTS.map((position) => {
              const photo = getPhotoAtPosition(position);
              const isUploading = uploadPhoto.isPending;

              return (
                <Pressable
                  key={position}
                  style={[
                    styles.photoSlot,
                    photo && styles.photoSlotFilled,
                  ]}
                  onPress={() => handlePickPhoto(position)}
                  disabled={isUploading}
                >
                  {photo?.url ? (
                    <Image
                      source={{ uri: photo.url }}
                      style={styles.photo}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <View style={styles.emptySlot}>
                      <Text style={styles.addIcon}>+</Text>
                    </View>
                  )}
                  {position === 0 && photo && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Main</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Prompts */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Prompts</Text>
              <Text style={styles.sectionSubtitle}>
                {profile.prompts.length}/3 prompts
              </Text>
            </View>
            <Pressable
              style={styles.editButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowPromptsModal(true);
              }}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          </View>
          {profile.prompts.map((prompt) => (
            <View key={prompt.id} style={styles.promptPreview}>
              <Text style={styles.promptQuestion}>{prompt.prompt_text}</Text>
              <Text style={styles.promptAnswer}>{prompt.answer_text}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Basic Info */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>About You</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>First Name</Text>
            <TextInput
              value={localValues.first_name}
              onChangeText={(v) => handleFieldChange('first_name', v)}
              onFocus={() => setEditingField('first_name')}
              onBlur={() => handleFieldBlur('first_name')}
              style={[styles.input, editingField === 'first_name' && styles.inputFocused]}
              placeholder="Your first name"
              placeholderTextColor={colors.muted}
              maxLength={50}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              value={localValues.bio}
              onChangeText={(v) => handleFieldChange('bio', v)}
              onFocus={() => setEditingField('bio')}
              onBlur={() => handleFieldBlur('bio')}
              style={[styles.input, styles.inputMultiline, editingField === 'bio' && styles.inputFocused]}
              placeholder="Write a short bio..."
              placeholderTextColor={colors.muted}
              multiline
              maxLength={500}
            />
            <Text style={styles.charCount}>{localValues.bio.length}/500</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Job Title</Text>
            <TextInput
              value={localValues.job_title}
              onChangeText={(v) => handleFieldChange('job_title', v)}
              onFocus={() => setEditingField('job_title')}
              onBlur={() => handleFieldBlur('job_title')}
              style={[styles.input, editingField === 'job_title' && styles.inputFocused]}
              placeholder="e.g., Product Designer"
              placeholderTextColor={colors.muted}
              maxLength={100}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Company</Text>
            <TextInput
              value={localValues.company}
              onChangeText={(v) => handleFieldChange('company', v)}
              onFocus={() => setEditingField('company')}
              onBlur={() => handleFieldBlur('company')}
              style={[styles.input, editingField === 'company' && styles.inputFocused]}
              placeholder="e.g., Acme Inc."
              placeholderTextColor={colors.muted}
              maxLength={100}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Education</Text>
            <TextInput
              value={localValues.education}
              onChangeText={(v) => handleFieldChange('education', v)}
              onFocus={() => setEditingField('education')}
              onBlur={() => handleFieldBlur('education')}
              style={[styles.input, editingField === 'education' && styles.inputFocused]}
              placeholder="e.g., Stanford University"
              placeholderTextColor={colors.muted}
              maxLength={100}
            />
          </View>
        </Animated.View>
      </ScrollView>

      {/* Prompts Modal */}
      <EditPromptsModal
        visible={showPromptsModal}
        onClose={() => setShowPromptsModal(false)}
        prompts={profile.prompts}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.muted,
  },
  editButton: {
    padding: spacing.sm,
  },
  editButtonText: {
    ...typography.body,
    color: colors.rose,
    fontWeight: '500',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  photoSlot: {
    width: '31%',
    aspectRatio: 4 / 5,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  photoSlotFilled: {
    borderStyle: 'solid',
    borderColor: colors.rose,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  emptySlot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
  addIcon: {
    fontSize: 32,
    color: colors.muted,
  },
  primaryBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.rose,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  primaryBadgeText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '600',
  },
  promptPreview: {
    backgroundColor: colors.cream,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  promptQuestion: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xxs,
  },
  promptAnswer: {
    ...typography.body,
    color: colors.textPrimary,
  },
  field: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  inputFocused: {
    borderColor: colors.rose,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
});
