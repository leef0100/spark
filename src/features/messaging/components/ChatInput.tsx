import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Keyboard,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  onTypingStart,
  onTypingStop,
}: ChatInputProps) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const inputRef = useRef<TextInput>(null);
  const sendButtonScale = useSharedValue(1);
  const sendButtonProgress = useSharedValue(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const canSend = message.trim().length > 0 && !disabled;

  useEffect(() => {
    sendButtonProgress.value = withSpring(canSend ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [canSend]);

  // Handle typing indicator
  const handleTextChange = useCallback((text: string) => {
    setMessage(text);

    // Start typing indicator
    if (text.length > 0 && !isTypingRef.current) {
      isTypingRef.current = true;
      onTypingStart?.();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    if (text.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        onTypingStop?.();
      }, 2000);
    } else {
      isTypingRef.current = false;
      onTypingStop?.();
    }
  }, [onTypingStart, onTypingStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        onTypingStop?.();
      }
    };
  }, [onTypingStop]);

  const handleSend = () => {
    if (!canSend) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate send button
    sendButtonScale.value = withSpring(0.8, { damping: 10, stiffness: 300 }, () => {
      sendButtonScale.value = withSpring(1, { damping: 10, stiffness: 300 });
    });

    onSend(message.trim());
    setMessage('');

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    isTypingRef.current = false;
    onTypingStop?.();

    Keyboard.dismiss();
  };

  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
    backgroundColor: interpolateColor(
      sendButtonProgress.value,
      [0, 1],
      [colors.lightGray, colors.rose]
    ),
  }));

  const sendIconStyle = useAnimatedStyle(() => ({
    opacity: interpolateColor(
      sendButtonProgress.value,
      [0, 1],
      [0.4, 1]
    ) as unknown as number,
  }));

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Platform.OS === 'ios' ? insets.bottom : spacing.sm },
      ]}
    >
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          value={message}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          style={styles.input}
          multiline
          maxLength={1000}
          editable={!disabled}
          returnKeyType="default"
        />
        <Pressable onPress={handleSend} disabled={!canSend}>
          <Animated.View style={[styles.sendButton, sendButtonStyle]}>
            <Animated.Text style={[styles.sendIcon, sendIconStyle]}>
              ↑
            </Animated.Text>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.cream,
    borderRadius: borderRadius.lg,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
