import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { typography, fonts } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';
import { LIMITS } from '../../../lib/constants';

interface CommentSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  contentType: 'photo' | 'prompt';
  contentPreview?: {
    imageUrl?: string;
    promptText?: string;
    answerText?: string;
  };
  recipientName: string;
  isSubmitting?: boolean;
}

const SHEET_HEIGHT = 420;

export function CommentSheet({
  visible,
  onClose,
  onSubmit,
  contentType,
  contentPreview,
  recipientName,
  isSubmitting = false,
}: CommentSheetProps) {
  const insets = useSafeAreaInsets();
  const [comment, setComment] = useState('');
  const inputRef = useRef<TextInput>(null);
  const translateY = useSharedValue(SHEET_HEIGHT);
  const overlayOpacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      overlayOpacity.value = withTiming(1, { duration: 200 });
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    } else {
      translateY.value = withSpring(SHEET_HEIGHT, { damping: 20, stiffness: 300 });
      overlayOpacity.value = withTiming(0, { duration: 200 });
      setComment('');
      Keyboard.dismiss();
    }
  }, [visible]);

  const closeSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = Math.max(0, context.value.y + event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        translateY.value = withSpring(SHEET_HEIGHT, { damping: 20, stiffness: 300 });
        overlayOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(closeSheet)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    pointerEvents: overlayOpacity.value > 0 ? 'auto' : 'none',
  }));

  const handleSubmit = () => {
    if (comment.trim().length < 1 || isSubmitting) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit(comment.trim());
  };

  const isValid = comment.trim().length >= 1;

  if (!visible && translateY.value >= SHEET_HEIGHT) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + spacing.md },
            sheetStyle,
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                Send a comment to {recipientName}
              </Text>
              <Pressable onPress={closeSheet} style={styles.closeButton}>
                <Text style={styles.closeText}>Cancel</Text>
              </Pressable>
            </View>

            {/* Content Preview */}
            <View style={styles.previewContainer}>
              {contentType === 'photo' && contentPreview?.imageUrl && (
                <Image
                  source={{ uri: contentPreview.imageUrl }}
                  style={styles.previewImage}
                  contentFit="cover"
                />
              )}
              {contentType === 'prompt' && contentPreview && (
                <View style={styles.previewPrompt}>
                  <Text style={styles.previewPromptQuestion} numberOfLines={1}>
                    {contentPreview.promptText}
                  </Text>
                  <Text style={styles.previewPromptAnswer} numberOfLines={2}>
                    {contentPreview.answerText}
                  </Text>
                </View>
              )}
            </View>

            {/* Comment Input */}
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                value={comment}
                onChangeText={setComment}
                placeholder="Write something thoughtful..."
                placeholderTextColor={colors.muted}
                style={styles.input}
                multiline
                maxLength={LIMITS.MAX_COMMENT_LENGTH || 500}
                editable={!isSubmitting}
              />
              <View style={styles.inputFooter}>
                <Text style={styles.charCount}>
                  {comment.length}/{LIMITS.MAX_COMMENT_LENGTH || 500}
                </Text>
                <Pressable
                  onPress={handleSubmit}
                  disabled={!isValid || isSubmitting}
                  style={[
                    styles.sendButton,
                    (!isValid || isSubmitting) && styles.sendButtonDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.sendText,
                      (!isValid || isSubmitting) && styles.sendTextDisabled,
                    ]}
                  >
                    {isSubmitting ? 'Sending...' : 'Send'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Hint */}
            <Text style={styles.hint}>
              Your comment will be sent along with your like
            </Text>
          </KeyboardAvoidingView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    minHeight: SHEET_HEIGHT,
  },
  keyboardView: {
    flex: 1,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.lightGray,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
    flex: 1,
  },
  closeButton: {
    padding: spacing.sm,
    marginRight: -spacing.sm,
  },
  closeText: {
    ...typography.body,
    color: colors.rose,
    fontWeight: '500',
  },
  previewContainer: {
    padding: spacing.lg,
  },
  previewImage: {
    width: 80,
    height: 100,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cream,
  },
  previewPrompt: {
    backgroundColor: colors.cream,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    maxWidth: '80%',
  },
  previewPromptQuestion: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xxs,
  },
  previewPromptAnswer: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.textPrimary,
  },
  inputContainer: {
    paddingHorizontal: spacing.lg,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  charCount: {
    ...typography.caption,
    color: colors.muted,
  },
  sendButton: {
    backgroundColor: colors.rose,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  sendButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  sendText: {
    ...typography.buttonSmall,
    color: colors.textInverse,
  },
  sendTextDisabled: {
    color: colors.muted,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
});
