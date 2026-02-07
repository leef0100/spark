import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export function NetworkStatus() {
  const insets = useSafeAreaInsets();
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [showBanner, setShowBanner] = useState(false);
  const translateY = useSharedValue(-60);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);

      if (!connected) {
        setShowBanner(true);
        translateY.value = withTiming(0, { duration: 300 });
      } else if (showBanner) {
        // Show "Back online" briefly then hide
        translateY.value = withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(0, { duration: 1500 }),
          withTiming(-60, { duration: 300 }, () => {
            runOnJS(setShowBanner)(false);
          })
        );
      }
    });

    return () => unsubscribe();
  }, [showBanner, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!showBanner) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.xs },
        isConnected ? styles.connected : styles.disconnected,
        animatedStyle,
      ]}
    >
      <Text style={styles.icon}>{isConnected ? '✓' : '⚡'}</Text>
      <Text style={styles.text}>
        {isConnected ? 'Back online' : 'No internet connection'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.sm,
    gap: spacing.xs,
    zIndex: 1000,
  },
  disconnected: {
    backgroundColor: colors.error,
  },
  connected: {
    backgroundColor: colors.success,
  },
  icon: {
    fontSize: 14,
    color: colors.textInverse,
  },
  text: {
    ...typography.bodySmall,
    color: colors.textInverse,
    fontWeight: '500',
  },
});
