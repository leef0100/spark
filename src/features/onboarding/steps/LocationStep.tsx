import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '../../../stores/onboardingStore';
import { Button } from '../../../components/ui/Button';
import { Spacer } from '../../../components/layout/Spacer';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';

export function LocationStep() {
  const { city, latitude, longitude, setLocation } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);
  const [manualCity, setManualCity] = useState(city);
  const [showManualInput, setShowManualInput] = useState(false);

  const hasLocation = latitude !== null && longitude !== null;

  const handleRequestLocation = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location access is needed to show you people nearby. You can enter your city manually instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Enter Manually',
              onPress: () => setShowManualInput(true),
            },
          ]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get city name
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const cityName = geocode?.city || geocode?.subregion || geocode?.region || 'Unknown';

      setLocation(cityName, location.coords.latitude, location.coords.longitude);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert(
        'Location Error',
        'Could not get your location. You can enter your city manually.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enter Manually',
            onPress: () => setShowManualInput(true),
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSave = () => {
    if (manualCity.trim()) {
      // Set city without coordinates for manual entry
      setLocation(manualCity.trim(), 0, 0);
      setShowManualInput(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Text style={styles.title}>Where are{'\n'}you located?</Text>
        <Text style={styles.subtitle}>
          We use your location to show you people nearby
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.content}>
        {hasLocation && city ? (
          <View style={styles.locationFound}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>{city}</Text>
            <Pressable
              onPress={handleRequestLocation}
              style={styles.refreshButton}
            >
              <Text style={styles.refreshText}>Update</Text>
            </Pressable>
          </View>
        ) : showManualInput ? (
          <View style={styles.manualInput}>
            <TextInput
              value={manualCity}
              onChangeText={setManualCity}
              style={styles.input}
              placeholder="Enter your city"
              placeholderTextColor={colors.muted}
              autoFocus
            />
            <Spacer size="md" />
            <Button
              title="Save"
              onPress={handleManualSave}
              disabled={!manualCity.trim()}
              fullWidth
            />
            <Spacer size="sm" />
            <Pressable
              onPress={() => setShowManualInput(false)}
              style={styles.backLink}
            >
              <Text style={styles.backLinkText}>Use my location instead</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.requestContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📍</Text>
            </View>

            <Spacer size="xl" />

            <Button
              title="Enable Location"
              onPress={handleRequestLocation}
              loading={isLoading}
              fullWidth
              size="large"
            />

            <Spacer size="md" />

            <Pressable
              onPress={() => setShowManualInput(true)}
              style={styles.manualLink}
            >
              <Text style={styles.manualLinkText}>Enter city manually</Text>
            </Pressable>
          </View>
        )}
      </Animated.View>

      <Animated.View entering={FadeIn.delay(400).duration(400)}>
        <Text style={styles.hint}>
          Your exact location is never shared with other users
        </Text>
      </Animated.View>
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
  content: {
    flex: 1,
    marginTop: spacing.xxl,
  },
  requestContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.roseLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
  },
  manualLink: {
    padding: spacing.sm,
  },
  manualLinkText: {
    ...typography.body,
    color: colors.rose,
    fontWeight: '500',
  },
  locationFound: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  locationIcon: {
    fontSize: 24,
  },
  locationText: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
  },
  refreshButton: {
    padding: spacing.sm,
  },
  refreshText: {
    ...typography.body,
    color: colors.rose,
    fontWeight: '500',
  },
  manualInput: {
    paddingTop: spacing.lg,
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
  backLink: {
    alignSelf: 'center',
    padding: spacing.sm,
  },
  backLinkText: {
    ...typography.body,
    color: colors.rose,
    fontWeight: '500',
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
