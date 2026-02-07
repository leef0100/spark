import React from 'react';
import { View, ViewStyle } from 'react-native';
import { spacing, SpacingName } from '../../theme/spacing';

interface SpacerProps {
  size?: SpacingName | number;
  horizontal?: boolean;
  flex?: number;
}

export function Spacer({ size = 'md', horizontal = false, flex }: SpacerProps) {
  const dimension = typeof size === 'number' ? size : spacing[size];

  const style: ViewStyle = flex
    ? { flex }
    : horizontal
    ? { width: dimension }
    : { height: dimension };

  return <View style={style} />;
}
