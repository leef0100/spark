import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeInDown, FadeIn, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore, OnboardingPrompt } from '../../../stores/onboardingStore';
import { Button } from '../../../components/ui/Button';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';
import { PROMPT_OPTIONS, LIMITS } from '../../../lib/constants';

const PROMPT_SLOTS = [0, 1, 2];

export function PromptsStep() {
  const insets = useSafeAreaInsets();
  const { prompts, setPrompt, removePrompt } = useOnboardingStore();

  const [showPromptPicker, setShowPromptPicker] = useState(false);
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [selectedPromptText, setSelectedPromptText] = useState('');
  const [answerText, setAnswerText] = useState('');

  const getPromptAtPosition = (position: number) =>
    prompts.find((p) => p.position === position);

  const usedPromptTexts = prompts.map((p) => p.promptText);

  const handleSelectSlot = (position: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const existing = getPromptAtPosition(position);

    if (existing) {
      // Edit existing prompt
      setSelectedPosition(position);
      setSelectedPromptText(existing.promptText);
      setAnswerText(existing.answerText);
      setShowAnswerInput(true);
    } else {
      // Select new prompt
      setSelectedPosition(position);
      setShowPromptPicker(true);
    }
  };

  const handleSelectPrompt = (promptText: string) => {
    Haptics.selectionAsync();
    setSelectedPromptText(promptText);
    setShowPromptPicker(false);
    setAnswerText('');
    setShowAnswerInput(true);
  };

  const handleSaveAnswer = () => {
    if (selectedPosition === null || !selectedPromptText || answerText.trim().length < 10) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setPrompt({
      promptText: selectedPromptText,
      answerText: answerText.trim(),
      position: selectedPosition,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAnswerInput(false);
    setSelectedPosition(null);
    setSelectedPromptText('');
    setAnswerText('');
  };

  const handleRemovePrompt = (position: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removePrompt(position);
  };

  const handleCloseModal = () => {
    setShowPromptPicker(false);
    setShowAnswerInput(false);
    setSelectedPosition(null);
    setSelectedPromptText('');
    setAnswerText('');
  };

  const promptCount = prompts.length;
  const isValid = promptCount >= LIMITS.MAX_PROMPTS &&
    prompts.every((p) => p.answerText.trim().length >= 10);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Text style={styles.title}>Share your{'\n'}personality</Text>
        <Text style={styles.subtitle}>
          Pick 3 prompts and write your answers
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.promptsContainer}>
        {PROMPT_SLOTS.map((position, index) => {
          const prompt = getPromptAtPosition(position);

          return (
            <Animated.View
              key={position}
              entering={FadeIn.delay(250 + index * 100).duration(300)}
            >
              <Pressable
                onPress={() => handleSelectSlot(position)}
                style={[styles.promptCard, prompt && styles.promptCardFilled]}
              >
                {prompt ? (
                  <View style={styles.promptContent}>
                    <Text style={styles.promptQuestion}>{prompt.promptText}</Text>
                    <Text style={styles.promptAnswer} numberOfLines={2}>
                      {prompt.answerText}
                    </Text>
                    <Pressable
                      onPress={() => handleRemovePrompt(position)}
                      style={styles.removeButton}
                      hitSlop={8}
                    >
                      <Text style={styles.removeIcon}>✕</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.emptyPrompt}>
                    <Text style={styles.addIcon}>+</Text>
                    <Text style={styles.addLabel}>Select a prompt</Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>

      <Animated.View entering={FadeIn.delay(500).duration(400)} style={styles.footer}>
        <View style={styles.countContainer}>
          <Text style={[styles.countText, isValid && styles.countTextValid]}>
            {promptCount}/{LIMITS.MAX_PROMPTS} prompts completed
          </Text>
          {isValid && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </Animated.View>

      {/* Prompt Picker Modal */}
      <Modal
        visible={showPromptPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose a prompt</Text>
            <Pressable onPress={handleCloseModal}>
              <Text style={styles.modalClose}>Cancel</Text>
            </Pressable>
          </View>

          <FlatList
            data={PROMPT_OPTIONS.filter((p) => !usedPromptTexts.includes(p))}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable
                style={styles.promptOption}
                onPress={() => handleSelectPrompt(item)}
              >
                <Text style={styles.promptOptionText}>{item}</Text>
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.promptList}
          />
        </View>
      </Modal>

      {/* Answer Input Modal */}
      <Modal
        visible={showAnswerInput}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalContainer, { paddingTop: insets.top }]}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={handleCloseModal}>
              <Text style={styles.modalClose}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSaveAnswer}
              disabled={answerText.trim().length < 10}
            >
              <Text
                style={[
                  styles.modalSave,
                  answerText.trim().length < 10 && styles.modalSaveDisabled,
                ]}
              >
                Save
              </Text>
            </Pressable>
          </View>

          <View style={styles.answerContainer}>
            <Text style={styles.selectedPrompt}>{selectedPromptText}</Text>
            <TextInput
              value={answerText}
              onChangeText={setAnswerText}
              style={styles.answerInput}
              placeholder="Write your answer..."
              placeholderTextColor={colors.muted}
              multiline
              maxLength={LIMITS.MAX_PROMPT_ANSWER_LENGTH}
              autoFocus
            />
            <Text style={styles.charCount}>
              {answerText.length}/{LIMITS.MAX_PROMPT_ANSWER_LENGTH}
            </Text>
            {answerText.length > 0 && answerText.length < 10 && (
              <Text style={styles.minChars}>
                Minimum 10 characters required
              </Text>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  promptsContainer: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  promptCard: {
    backgroundColor: colors.cream,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    minHeight: 100,
  },
  promptCardFilled: {
    borderStyle: 'solid',
    borderColor: colors.rose,
    backgroundColor: colors.surface,
  },
  emptyPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  addIcon: {
    fontSize: 28,
    color: colors.muted,
    fontWeight: '300',
  },
  addLabel: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  promptContent: {
    padding: spacing.md,
    position: 'relative',
  },
  promptQuestion: {
    ...typography.labelSmall,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  promptAnswer: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontFamily: 'Georgia',
  },
  removeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    color: colors.muted,
    fontSize: 12,
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  modalClose: {
    ...typography.body,
    color: colors.rose,
    fontWeight: '500',
  },
  modalSave: {
    ...typography.body,
    color: colors.rose,
    fontWeight: '600',
  },
  modalSaveDisabled: {
    color: colors.muted,
  },
  promptList: {
    paddingVertical: spacing.md,
  },
  promptOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  promptOptionText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  answerContainer: {
    padding: spacing.lg,
    flex: 1,
  },
  selectedPrompt: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  answerInput: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    flex: 1,
    textAlignVertical: 'top',
  },
  charCount: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  minChars: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.xs,
  },
});
