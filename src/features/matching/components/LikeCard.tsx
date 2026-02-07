import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { LikeReceived } from '../services/matchingService';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

interface LikeCardProps {
  like: LikeReceived;
  onPress: () => void;
  index: number;
}

export function LikeCard({ like, onPress, index }: LikeCardProps) {
  const scale = useSharedValue(1);
  const { likerProfile, commentText } = like;
  const primaryPhoto = likerProfile.photos[0];

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(index * 100).duration(300)}
      style={styles.container}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[styles.card, animatedStyle]}>
          <Image
            source={{ uri: primaryPhoto?.url }}
            style={styles.photo}
            contentFit="cover"
            transition={200}
          />

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.gradient}
          />

          {/* Name and age */}
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {likerProfile.first_name}, {likerProfile.age}
            </Text>
          </View>

          {/* Comment indicator */}
          {commentText && (
            <View style={styles.commentBadge}>
              <Text style={styles.commentIcon}>💬</Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.cream,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  name: {
    ...typography.h4,
    color: colors.textInverse,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  commentBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.rose,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentIcon: {
    fontSize: 14,
  },
});
