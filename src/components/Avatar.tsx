import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
  ImageStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Typography } from '@/constants/theme';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  source?: ImageSourcePropType | { uri: string };
  name?: string;
  size?: AvatarSize;
  isVerified?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  isVerified = false,
  style,
}) => {
  const getInitials = (fullName?: string) => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const hasImage = !!source && (typeof source === 'number' || !!(source as { uri?: string }).uri);

  return (
    <View style={[styles.wrapper, avatarDimensionStyles[size], style]}>
      {hasImage ? (
        <Image
          source={source as ImageSourcePropType}
          style={[styles.image, avatarImageDimensionStyles[size]]}
        />
      ) : (
        <View style={[styles.fallback, avatarDimensionStyles[size]]}>
          <Text style={[styles.initials, avatarTextSizeStyles[size]]}>
            {getInitials(name)}
          </Text>
        </View>
      )}

      {isVerified && (
        <View style={[styles.verifiedBadge, badgePositionStyles[size]]}>
          <Ionicons
            name="checkmark-circle"
            size={size === 'sm' ? 12 : size === 'md' ? 16 : size === 'lg' ? 20 : 24}
            color={Colors.success}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  image: {
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
  },
  fallback: {
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accentLight,
    borderWidth: 1.5,
    borderColor: Colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
  },
  verifiedBadge: {
    position: 'absolute',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
  },
});

const avatarDimensionStyles = StyleSheet.create<Record<AvatarSize, ViewStyle>>({
  sm: {
    width: 32,
    height: 32,
  },
  md: {
    width: 44,
    height: 44,
  },
  lg: {
    width: 56,
    height: 56,
  },
  xl: {
    width: 72,
    height: 72,
  },
});

const avatarImageDimensionStyles = StyleSheet.create<Record<AvatarSize, ImageStyle>>({
  sm: {
    width: 32,
    height: 32,
  },
  md: {
    width: 44,
    height: 44,
  },
  lg: {
    width: 56,
    height: 56,
  },
  xl: {
    width: 72,
    height: 72,
  },
});

const avatarTextSizeStyles = StyleSheet.create<Record<AvatarSize, TextStyle>>({
  sm: {
    fontSize: Typography.sizes.xs,
  },
  md: {
    fontSize: Typography.sizes.sm,
  },
  lg: {
    fontSize: Typography.sizes.lg,
  },
  xl: {
    fontSize: Typography.sizes.xxl,
  },
});

const badgePositionStyles = StyleSheet.create<Record<AvatarSize, ViewStyle>>({
  sm: {
    bottom: -3,
    right: -3,
  },
  md: {
    bottom: -2,
    right: -2,
  },
  lg: {
    bottom: -1,
    right: -1,
  },
  xl: {
    bottom: 0,
    right: 0,
  },
});
