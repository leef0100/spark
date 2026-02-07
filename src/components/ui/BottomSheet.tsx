import React, { useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { springs, timing } from '../../theme/animations';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BottomSheetRef {
  open: () => void;
  close: () => void;
}

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnapIndex?: number;
  onClose?: () => void;
  enableDragToClose?: boolean;
  showHandle?: boolean;
  backdropOpacity?: number;
}

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  (
    {
      children,
      snapPoints = [0.5],
      initialSnapIndex = 0,
      onClose,
      enableDragToClose = true,
      showHandle = true,
      backdropOpacity = 0.5,
    },
    ref
  ) => {
    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const context = useSharedValue({ y: 0 });
    const isOpen = useSharedValue(false);

    const maxHeight = SCREEN_HEIGHT * Math.max(...snapPoints);
    const snapPointsInPixels = snapPoints.map(
      (point) => SCREEN_HEIGHT - SCREEN_HEIGHT * point
    );

    const open = useCallback(() => {
      'worklet';
      isOpen.value = true;
      translateY.value = withSpring(
        snapPointsInPixels[initialSnapIndex],
        springs.gentle
      );
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    }, [translateY, snapPointsInPixels, initialSnapIndex, isOpen]);

    const close = useCallback(() => {
      'worklet';
      translateY.value = withTiming(SCREEN_HEIGHT, timing.normal, () => {
        isOpen.value = false;
        if (onClose) {
          runOnJS(onClose)();
        }
      });
    }, [translateY, onClose, isOpen]);

    useImperativeHandle(ref, () => ({
      open: () => {
        open();
      },
      close: () => {
        close();
      },
    }));

    useEffect(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (isOpen.value) {
            close();
            return true;
          }
          return false;
        }
      );

      return () => backHandler.remove();
    }, [close, isOpen]);

    const gesture = Gesture.Pan()
      .onStart(() => {
        context.value = { y: translateY.value };
      })
      .onUpdate((event) => {
        translateY.value = Math.max(
          context.value.y + event.translationY,
          snapPointsInPixels[snapPointsInPixels.length - 1]
        );
      })
      .onEnd((event) => {
        if (enableDragToClose && translateY.value > SCREEN_HEIGHT * 0.6) {
          close();
        } else {
          // Snap to nearest point
          const distances = snapPointsInPixels.map((point) =>
            Math.abs(translateY.value - point)
          );
          const closestIndex = distances.indexOf(Math.min(...distances));
          translateY.value = withSpring(
            snapPointsInPixels[closestIndex],
            springs.gentle
          );
        }
      });

    const animatedSheetStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const animatedBackdropStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        translateY.value,
        [SCREEN_HEIGHT, snapPointsInPixels[0]],
        [0, backdropOpacity],
        Extrapolation.CLAMP
      );

      return {
        opacity,
        pointerEvents: isOpen.value ? 'auto' : 'none',
      };
    });

    return (
      <>
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} />
        </Animated.View>

        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              styles.container,
              { maxHeight, paddingBottom: insets.bottom + spacing.md },
              animatedSheetStyle,
            ]}
          >
            {showHandle && (
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>
            )}

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.content}
            >
              {children}
            </KeyboardAvoidingView>
          </Animated.View>
        </GestureDetector>
      </>
    );
  }
);

BottomSheet.displayName = 'BottomSheet';

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    zIndex: 100,
  },
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    zIndex: 101,
    ...shadows.xl,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.lightGray,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
});
