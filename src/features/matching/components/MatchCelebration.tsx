import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LikeReceived } from '../services/matchingService';
import { Button } from '../../../components/ui/Button';
import { colors } from '../../../theme/colors';
import { typography, fonts } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = 120;

interface MatchCelebrationProps {
  visible: boolean;
  matchedProfile: LikeReceived['likerProfile'] | null;
  onClose: () => void;
  onSendMessage: () => void;
}

export function MatchCelebration({
  visible,
  matchedProfile,
  onClose,
  onSendMessage,
}: MatchCelebrationProps) {
  const insets = useSafeAreaInsets();

  // Animation values
  const backgroundOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.8);
  const contentOpacity = useSharedValue(0);
  const avatarScale = useSharedValue(0);
  const heartsOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const buttonsOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Start animation sequence
      backgroundOpacity.value = withTiming(1, { duration: 300 });
      contentOpacity.value = withDelay(100, withTiming(1, { duration: 300 }));
      contentScale.value = withDelay(
        100,
        withSpring(1, { damping: 12, stiffness: 100 })
      );
      avatarScale.value = withDelay(
        200,
        withSequence(
          withSpring(1.1, { damping: 8, stiffness: 150 }),
          withSpring(1, { damping: 10, stiffness: 100 })
        )
      );
      heartsOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
      titleTranslateY.value = withDelay(
        300,
        withSpring(0, { damping: 12, stiffness: 100 })
      );
      buttonsOpacity.value = withDelay(500, withTiming(1, { duration: 300 }));

      // Haptic celebration
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 200);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 400);
    } else {
      // Reset values
      backgroundOpacity.value = 0;
      contentScale.value = 0.8;
      contentOpacity.value = 0;
      avatarScale.value = 0;
      heartsOpacity.value = 0;
      titleTranslateY.value = 20;
      buttonsOpacity.value = 0;
    }
  }, [visible]);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const heartsStyle = useAnimatedStyle(() => ({
    opacity: heartsOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      titleTranslateY.value,
      [20, 0],
      [0, 1],
      Extrapolation.CLAMP
    ),
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }));

  if (!matchedProfile) return null;

  const primaryPhoto = matchedProfile.photos[0];

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Background */}
        <Animated.View style={[styles.background, backgroundStyle]} />

        {/* Content */}
        <Animated.View style={[styles.content, contentStyle]}>
          {/* Floating Hearts */}
          <Animated.View style={[styles.heartsContainer, heartsStyle]}>
            {[...Array(6)].map((_, i) => (
              <FloatingHeart key={i} delay={i * 100} index={i} />
            ))}
          </Animated.View>

          {/* Avatar */}
          <Animated.View style={[styles.avatarContainer, avatarStyle]}>
            <Image
              source={{ uri: primaryPhoto?.url }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.avatarGlow} />
          </Animated.View>

          {/* Title */}
          <Animated.View style={[styles.titleContainer, titleStyle]}>
            <Text style={styles.matchEmoji}>🎉</Text>
            <Text style={styles.title}>It's a Match!</Text>
            <Text style={styles.subtitle}>
              You and {matchedProfile.first_name} liked each other
            </Text>
          </Animated.View>

          {/* Buttons */}
          <Animated.View
            style={[
              styles.buttons,
              { paddingBottom: insets.bottom + spacing.lg },
              buttonsStyle,
            ]}
          >
            <Button
              title="Send a Message"
              variant="primary"
              onPress={onSendMessage}
              fullWidth
              size="large"
            />
            <Button
              title="Keep Browsing"
              variant="ghost"
              onPress={onClose}
              fullWidth
            />
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

interface FloatingHeartProps {
  delay: number;
  index: number;
}

function FloatingHeart({ delay, index }: FloatingHeartProps) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    const xOffset = (index % 2 === 0 ? -1 : 1) * (20 + Math.random() * 30);

    scale.value = withDelay(
      delay,
      withSpring(0.6 + Math.random() * 0.4, { damping: 10, stiffness: 100 })
    );
    translateY.value = withDelay(
      delay,
      withTiming(-150 - Math.random() * 100, { duration: 2000 })
    );
    translateX.value = withDelay(
      delay,
      withTiming(xOffset, { duration: 2000 })
    );
    opacity.value = withDelay(
      delay + 1500,
      withTiming(0, { duration: 500 })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.floatingHeart, style]}>❤️</Animated.Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(212, 98, 110, 0.95)',
  },
  content: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  heartsContainer: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingHeart: {
    position: 'absolute',
    fontSize: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    borderColor: colors.surface,
  },
  avatarGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: (AVATAR_SIZE + 16) / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  matchEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 36,
    fontWeight: '700',
    color: colors.textInverse,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.textInverse,
    opacity: 0.9,
    textAlign: 'center',
  },
  buttons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
});
