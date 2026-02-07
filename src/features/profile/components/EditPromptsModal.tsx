import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useUpsertPrompt, useDeletePrompt } from '../hooks';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';
import { PROMPT_OPTIONS, LIMITS } from '../../../lib/constants';

interface Prompt {
  id: string;
  prompt_text: string;
  answer_text: string;
  position: number;
}

interface EditPromptsModalProps {
  visible: boolean;
  onClose: () => void;
  prompts: Prompt[];
}

type ModalView = 'list' | 'select' | 'edit';

export function EditPromptsModal({
  visible,
  onClose,
  prompts,
}: EditPromptsModalProps) {
  const insets = useSafeAreaInsets();
  const upsertPrompt = useUpsertPrompt();
  const deletePrompt = useDeletePrompt();

  const [view, setView] = useState<ModalView>('list');
  const [editingPosition, setEditingPosition] = useState<number | null>(null);
  const [selectedPromptText, setSelectedPromptText] = useState('');
  const [answerText, setAnswerText] = useState('');

  const usedPromptTexts = prompts.map((p) => p.prompt_text);

  const handleClose = () => {
    setView('list');
    setEditingPosition(null);
    setSelectedPromptText('');
    setAnswerText('');
    onClose();
  };

  const handleAddPrompt = (position: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingPosition(position);
    setView('select');
  };

  const handleEditPrompt = (prompt: Prompt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingPosition(prompt.position);
    setSelectedPromptText(prompt.prompt_text);
    setAnswerText(prompt.answer_text);
    setView('edit');
  };

  const handleSelectPrompt = (promptText: string) => {
    Haptics.selectionAsync();
    setSelectedPromptText(promptText);
    setAnswerText('');
    setView('edit');
  };

  const handleSavePrompt = () => {
    if (editingPosition === null || !selectedPromptText || answerText.trim().length < 10) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    upsertPrompt.mutate(
      {
        promptText: selectedPromptText,
        answerText: answerText.trim(),
        position: editingPosition,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setView('list');
          setEditingPosition(null);
          setSelectedPromptText('');
          setAnswerText('');
        },
      }
    );
  };

  const handleDeletePrompt = (prompt: Prompt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deletePrompt.mutate(prompt.id);
  };

  const getPromptAtPosition = (position: number) => {
    return prompts.find((p) => p.position === position);
  };

  const renderListView = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.listContent}>
      {[0, 1, 2].map((position) => {
        const prompt = getPromptAtPosition(position);

        return (
          <Animated.View
            key={position}
            entering={FadeIn.delay(position * 100).duration(300)}
          >
            {prompt ? (
              <View style={styles.promptCard}>
                <Pressable
                  style={styles.promptCardContent}
                  onPress={() => handleEditPrompt(prompt)}
                >
                  <Text style={styles.promptQuestion}>{prompt.prompt_text}</Text>
                  <Text style={styles.promptAnswer}>{prompt.answer_text}</Text>
                </Pressable>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeletePrompt(prompt)}
                >
                  <Text style={styles.deleteIcon}>✕</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.emptyPromptCard}
                onPress={() => handleAddPrompt(position)}
              >
                <Text style={styles.addIcon}>+</Text>
                <Text style={styles.addLabel}>Add a prompt</Text>
              </Pressable>
            )}
          </Animated.View>
        );
      })}
    </ScrollView>
  );

  const renderSelectView = () => (
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
      contentContainerStyle={styles.selectContent}
    />
  );

  const renderEditView = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.editContainer}
    >
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.editPromptText}>{selectedPromptText}</Text>
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
        <View style={styles.editFooter}>
          <Text style={styles.charCount}>
            {answerText.length}/{LIMITS.MAX_PROMPT_ANSWER_LENGTH}
          </Text>
          {answerText.length > 0 && answerText.length < 10 && (
            <Text style={styles.minChars}>Minimum 10 characters</Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const getTitle = () => {
    switch (view) {
      case 'select':
        return 'Choose a prompt';
      case 'edit':
        return 'Your answer';
      default:
        return 'Edit Prompts';
    }
  };

  const getHeaderRight = () => {
    if (view === 'edit') {
      return (
        <Pressable
          onPress={handleSavePrompt}
          disabled={answerText.trim().length < 10 || upsertPrompt.isPending}
        >
          <Text
            style={[
              styles.saveButton,
              (answerText.trim().length < 10 || upsertPrompt.isPending) &&
                styles.saveButtonDisabled,
            ]}
          >
            {upsertPrompt.isPending ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      );
    }
    return null;
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (view === 'edit') {
      setView('select');
      setAnswerText('');
    } else if (view === 'select') {
      setView('list');
      setEditingPosition(null);
    } else {
      handleClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>
              {view === 'list' ? 'Done' : 'Back'}
            </Text>
          </Pressable>
          <Text style={styles.title}>{getTitle()}</Text>
          <View style={styles.headerButton}>
            {getHeaderRight()}
          </View>
        </View>

        {/* Content */}
        {view === 'list' && renderListView()}
        {view === 'select' && renderSelectView()}
        {view === 'edit' && renderEditView()}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    minWidth: 60,
  },
  headerButtonText: {
    ...typography.body,
    color: colors.rose,
    fontWeight: '500',
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  saveButton: {
    ...typography.body,
    color: colors.rose,
    fontWeight: '600',
    textAlign: 'right',
  },
  saveButtonDisabled: {
    color: colors.muted,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  promptCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.rose,
    overflow: 'hidden',
  },
  promptCardContent: {
    flex: 1,
    padding: spacing.md,
  },
  promptQuestion: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  promptAnswer: {
    ...typography.body,
    color: colors.textPrimary,
  },
  deleteButton: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
  deleteIcon: {
    fontSize: 16,
    color: colors.muted,
  },
  emptyPromptCard: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: 32,
    color: colors.muted,
  },
  addLabel: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  selectContent: {
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
  editContainer: {
    flex: 1,
  },
  editPromptText: {
    ...typography.h3,
    color: colors.textPrimary,
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  answerInput: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  editFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  charCount: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'right',
  },
  minChars: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.xs,
  },
});
