import { AccessibilityInfo, Platform } from 'react-native';
import { useEffect, useState, useCallback } from 'react';

/**
 * Accessibility props for interactive elements
 */
export interface AccessibilityProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'none' | 'button' | 'link' | 'search' | 'image' | 'keyboardkey' | 'text' | 'adjustable' | 'imagebutton' | 'header' | 'summary' | 'alert' | 'checkbox' | 'combobox' | 'menu' | 'menubar' | 'menuitem' | 'progressbar' | 'radio' | 'radiogroup' | 'scrollbar' | 'spinbutton' | 'switch' | 'tab' | 'tablist' | 'timer' | 'toolbar';
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
}

/**
 * Hook to check if screen reader is enabled
 */
export function useScreenReader() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setIsEnabled);

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsEnabled
    );

    return () => subscription.remove();
  }, []);

  return isEnabled;
}

/**
 * Hook to check if reduce motion is enabled
 */
export function useReduceMotion() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsEnabled);

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsEnabled
    );

    return () => subscription.remove();
  }, []);

  return isEnabled;
}

/**
 * Hook to check if bold text is enabled (iOS only)
 */
export function useBoldText() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.isBoldTextEnabled().then(setIsEnabled);

      const subscription = AccessibilityInfo.addEventListener(
        'boldTextChanged',
        setIsEnabled
      );

      return () => subscription.remove();
    }
  }, []);

  return isEnabled;
}

/**
 * Announce a message to screen readers
 */
export function announceForAccessibility(message: string) {
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * Create accessibility props for a button
 */
export function buttonA11y(
  label: string,
  hint?: string,
  disabled?: boolean
): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: { disabled },
  };
}

/**
 * Create accessibility props for an image
 */
export function imageA11y(description: string): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: 'image',
    accessibilityLabel: description,
  };
}

/**
 * Create accessibility props for a header
 */
export function headerA11y(text: string): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: 'header',
    accessibilityLabel: text,
  };
}

/**
 * Create accessibility props for a switch/toggle
 */
export function switchA11y(
  label: string,
  isOn: boolean,
  hint?: string
): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: 'switch',
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: { checked: isOn },
  };
}

/**
 * Create accessibility props for a slider
 */
export function sliderA11y(
  label: string,
  value: number,
  min: number,
  max: number
): AccessibilityProps {
  const percentage = Math.round(((value - min) / (max - min)) * 100);
  return {
    accessible: true,
    accessibilityRole: 'adjustable',
    accessibilityLabel: `${label}, ${percentage} percent`,
    accessibilityHint: 'Swipe up or down to adjust',
  };
}

/**
 * Create accessibility props for a tab
 */
export function tabA11y(
  label: string,
  isSelected: boolean,
  index: number,
  total: number
): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: 'tab',
    accessibilityLabel: `${label}, tab ${index + 1} of ${total}`,
    accessibilityState: { selected: isSelected },
  };
}

/**
 * Format time for accessibility (converts seconds to spoken format)
 */
export function formatTimeForA11y(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);

  return parts.join(' and ');
}

/**
 * Format distance for accessibility
 */
export function formatDistanceForA11y(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} meters away`;
  }
  return `${km} kilometer${km !== 1 ? 's' : ''} away`;
}
