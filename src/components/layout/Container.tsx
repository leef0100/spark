import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing, layout } from '../../theme/spacing';

interface ContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  safeArea?: boolean;
  safeAreaEdges?: ('top' | 'bottom' | 'left' | 'right')[];
  backgroundColor?: string;
  padding?: boolean;
  centered?: boolean;
}

export function Container({
  children,
  style,
  safeArea = true,
  safeAreaEdges = ['top', 'bottom'],
  backgroundColor = colors.background,
  padding = true,
  centered = false,
}: ContainerProps) {
  const insets = useSafeAreaInsets();

  const safeAreaStyle: ViewStyle = safeArea
    ? {
        paddingTop: safeAreaEdges.includes('top') ? insets.top : 0,
        paddingBottom: safeAreaEdges.includes('bottom') ? insets.bottom : 0,
        paddingLeft: safeAreaEdges.includes('left') ? insets.left : 0,
        paddingRight: safeAreaEdges.includes('right') ? insets.right : 0,
      }
    : {};

  return (
    <View
      style={[
        styles.container,
        { backgroundColor },
        safeAreaStyle,
        padding && styles.padding,
        centered && styles.centered,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
