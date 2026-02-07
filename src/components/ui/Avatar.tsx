import React from 'react';
import { View, StyleSheet, ViewStyle, Text, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { layout, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

export type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  showOnlineIndicator?: boolean;
  isOnline?: boolean;
  style?: ViewStyle;
  blurhash?: string;
}

const sizeMap: Record<AvatarSize, number> = {
  small: layout.avatarSizeSmall,
  medium: layout.avatarSizeMedium,
  large: layout.avatarSizeLarge,
  xlarge: layout.avatarSizeXLarge,
};

const onlineIndicatorSizeMap: Record<AvatarSize, number> = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 20,
};

const fontSizeMap: Record<AvatarSize, number> = {
  small: 12,
  medium: 18,
  large: 28,
  xlarge: 40,
};

export function Avatar({
  source,
  name,
  size = 'medium',
  showOnlineIndicator = false,
  isOnline = false,
  style,
  blurhash,
}: AvatarProps) {
  const dimension = sizeMap[size];
  const onlineIndicatorSize = onlineIndicatorSizeMap[size];
  const fontSize = fontSizeMap[size];

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
  };

  const imageStyle: ImageStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
    backgroundColor: colors.cream,
  };

  return (
    <View style={[styles.container, containerStyle, style]}>
      {source ? (
        <Image
          source={{ uri: source }}
          style={imageStyle}
          contentFit="cover"
          placeholder={blurhash}
          transition={200}
        />
      ) : (
        <View style={[styles.placeholder, containerStyle]}>
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </View>
      )}

      {showOnlineIndicator && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: onlineIndicatorSize,
              height: onlineIndicatorSize,
              borderRadius: onlineIndicatorSize / 2,
              backgroundColor: isOnline ? colors.success : colors.muted,
              borderWidth: onlineIndicatorSize > 10 ? 3 : 2,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    backgroundColor: colors.cream,
  },
  placeholder: {
    backgroundColor: colors.roseMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...typography.label,
    color: colors.rose,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderColor: colors.surface,
  },
});
