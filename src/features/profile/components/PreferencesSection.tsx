import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { usePreferences, useUpdatePreferences } from '../hooks';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';

const SLIDER_WIDTH = 280;
const KNOB_SIZE = 24;

export function PreferencesSection() {
  const { data: preferences, isLoading } = usePreferences();
  const updatePreferences = useUpdatePreferences();

  const [localPrefs, setLocalPrefs] = useState({
    min_age: 18,
    max_age: 50,
    max_distance_km: 50,
    show_me: ['everyone'] as string[],
  });

  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        min_age: preferences.min_age,
        max_age: preferences.max_age,
        max_distance_km: preferences.max_distance_km,
        show_me: preferences.show_me,
      });
    }
  }, [preferences]);

  const handleAgeChange = useCallback(
    (min: number, max: number) => {
      setLocalPrefs((prev) => ({ ...prev, min_age: min, max_age: max }));
    },
    []
  );

  const handleAgeSave = useCallback(() => {
    updatePreferences.mutate({
      min_age: localPrefs.min_age,
      max_age: localPrefs.max_age,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [localPrefs.min_age, localPrefs.max_age, updatePreferences]);

  const handleDistanceChange = useCallback((distance: number) => {
    setLocalPrefs((prev) => ({ ...prev, max_distance_km: distance }));
  }, []);

  const handleDistanceSave = useCallback(() => {
    updatePreferences.mutate({ max_distance_km: localPrefs.max_distance_km });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [localPrefs.max_distance_km, updatePreferences]);

  const handleShowMeChange = useCallback(
    (value: string[]) => {
      setLocalPrefs((prev) => ({ ...prev, show_me: value }));
      updatePreferences.mutate({ show_me: value });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [updatePreferences]
  );

  if (isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Age Range */}
      <View style={styles.preferenceItem}>
        <View style={styles.preferenceHeader}>
          <Text style={styles.preferenceLabel}>Age Range</Text>
          <Text style={styles.preferenceValue}>
            {localPrefs.min_age} - {localPrefs.max_age}
          </Text>
        </View>
        <RangeSlider
          min={18}
          max={70}
          minValue={localPrefs.min_age}
          maxValue={localPrefs.max_age}
          onChange={handleAgeChange}
          onChangeEnd={handleAgeSave}
        />
      </View>

      <View style={styles.divider} />

      {/* Distance */}
      <View style={styles.preferenceItem}>
        <View style={styles.preferenceHeader}>
          <Text style={styles.preferenceLabel}>Maximum Distance</Text>
          <Text style={styles.preferenceValue}>
            {localPrefs.max_distance_km} km
          </Text>
        </View>
        <Slider
          min={1}
          max={100}
          value={localPrefs.max_distance_km}
          onChange={handleDistanceChange}
          onChangeEnd={handleDistanceSave}
        />
      </View>

      <View style={styles.divider} />

      {/* Show Me */}
      <View style={styles.preferenceItem}>
        <Text style={styles.preferenceLabel}>Show Me</Text>
        <View style={styles.showMeOptions}>
          {['men', 'women', 'everyone'].map((option) => {
            const isSelected = localPrefs.show_me.includes(option);
            return (
              <Pressable
                key={option}
                style={[styles.showMeOption, isSelected && styles.showMeOptionSelected]}
                onPress={() => handleShowMeChange([option])}
              >
                <Text
                  style={[
                    styles.showMeOptionText,
                    isSelected && styles.showMeOptionTextSelected,
                  ]}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

interface SliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  onChangeEnd: () => void;
}

function Slider({ min, max, value, onChange, onChangeEnd }: SliderProps) {
  const position = useSharedValue(((value - min) / (max - min)) * SLIDER_WIDTH);

  useEffect(() => {
    position.value = ((value - min) / (max - min)) * SLIDER_WIDTH;
  }, [value, min, max]);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      const newPos = Math.max(0, Math.min(SLIDER_WIDTH, event.x));
      position.value = newPos;
      const newValue = Math.round(min + (newPos / SLIDER_WIDTH) * (max - min));
      onChange(newValue);
    })
    .onEnd(() => {
      onChangeEnd();
    });

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value - KNOB_SIZE / 2 }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: position.value,
  }));

  return (
    <View style={styles.sliderContainer}>
      <GestureDetector gesture={gesture}>
        <View style={styles.sliderTrack}>
          <Animated.View style={[styles.sliderFill, fillStyle]} />
          <Animated.View style={[styles.sliderKnob, knobStyle]} />
        </View>
      </GestureDetector>
    </View>
  );
}

interface RangeSliderProps {
  min: number;
  max: number;
  minValue: number;
  maxValue: number;
  onChange: (min: number, max: number) => void;
  onChangeEnd: () => void;
}

function RangeSlider({
  min,
  max,
  minValue,
  maxValue,
  onChange,
  onChangeEnd,
}: RangeSliderProps) {
  const minPos = useSharedValue(((minValue - min) / (max - min)) * SLIDER_WIDTH);
  const maxPos = useSharedValue(((maxValue - min) / (max - min)) * SLIDER_WIDTH);

  useEffect(() => {
    minPos.value = ((minValue - min) / (max - min)) * SLIDER_WIDTH;
    maxPos.value = ((maxValue - min) / (max - min)) * SLIDER_WIDTH;
  }, [minValue, maxValue, min, max]);

  const minGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newPos = Math.max(0, Math.min(maxPos.value - KNOB_SIZE, event.x));
      minPos.value = newPos;
      const newMin = Math.round(min + (newPos / SLIDER_WIDTH) * (max - min));
      onChange(newMin, maxValue);
    })
    .onEnd(() => {
      onChangeEnd();
    });

  const maxGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newPos = Math.max(minPos.value + KNOB_SIZE, Math.min(SLIDER_WIDTH, event.x));
      maxPos.value = newPos;
      const newMax = Math.round(min + (newPos / SLIDER_WIDTH) * (max - min));
      onChange(minValue, newMax);
    })
    .onEnd(() => {
      onChangeEnd();
    });

  const minKnobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: minPos.value - KNOB_SIZE / 2 }],
  }));

  const maxKnobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: maxPos.value - KNOB_SIZE / 2 }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    left: minPos.value,
    width: maxPos.value - minPos.value,
  }));

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderTrack}>
        <Animated.View style={[styles.sliderFill, styles.rangeFill, fillStyle]} />
        <GestureDetector gesture={minGesture}>
          <Animated.View style={[styles.sliderKnob, minKnobStyle]} />
        </GestureDetector>
        <GestureDetector gesture={maxGesture}>
          <Animated.View style={[styles.sliderKnob, maxKnobStyle]} />
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
  },
  preferenceItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  preferenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  preferenceLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  preferenceValue: {
    ...typography.body,
    color: colors.rose,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
  sliderContainer: {
    paddingVertical: spacing.sm,
  },
  sliderTrack: {
    height: 6,
    width: SLIDER_WIDTH,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: colors.rose,
    borderRadius: 3,
    left: 0,
  },
  rangeFill: {
    left: 0,
  },
  sliderKnob: {
    position: 'absolute',
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.rose,
    top: -(KNOB_SIZE - 6) / 2,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  showMeOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  showMeOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  showMeOptionSelected: {
    borderColor: colors.rose,
    backgroundColor: colors.roseLight,
  },
  showMeOptionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  showMeOptionTextSelected: {
    color: colors.rose,
  },
});
