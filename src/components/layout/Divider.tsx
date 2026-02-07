import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface DividerProps {
  color?: string;
  thickness?: number;
  spacing?: number;
  style?: ViewStyle;
}

export function Divider({
  color = colors.border,
  thickness = 1,
  spacing: dividerSpacing = spacing.md,
  style,
}: DividerProps) {
  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: color,
          height: thickness,
          marginVertical: dividerSpacing,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    width: '100%',
  },
});
