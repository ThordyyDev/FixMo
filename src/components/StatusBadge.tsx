import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

export type BadgeStatus = 'neutral' | 'success' | 'warning' | 'error' | 'accent';
export type BadgeSize = 'sm' | 'md';

export interface StatusBadgeProps {
  label: string;
  status?: BadgeStatus;
  size?: BadgeSize;
  showDot?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  status = 'neutral',
  size = 'md',
  showDot = false,
  style,
}) => {
  return (
    <View
      style={[
        styles.badge,
        badgeVariantStyles[status],
        badgeSizeStyles[size],
        style,
      ]}
    >
      {showDot && (
        <View
          style={[
            styles.dot,
            dotVariantStyles[status],
            size === 'sm' && styles.dotSmall,
          ]}
        />
      )}
      <Text
        style={[
          styles.text,
          textVariantStyles[status],
          textSizeStyles[size],
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
  dotSmall: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  text: {
    fontWeight: Typography.weights.semibold,
  },
});

const badgeSizeStyles = StyleSheet.create<Record<BadgeSize, ViewStyle>>({
  sm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xxs,
  },
});

const badgeVariantStyles = StyleSheet.create<Record<BadgeStatus, ViewStyle>>({
  neutral: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
  },
  success: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.successBorder,
  },
  warning: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warningBorder,
  },
  error: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.errorBorder,
  },
  accent: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accentBorder,
  },
});

const dotVariantStyles = StyleSheet.create<Record<BadgeStatus, ViewStyle>>({
  neutral: {
    backgroundColor: Colors.textSecondary,
  },
  success: {
    backgroundColor: Colors.success,
  },
  warning: {
    backgroundColor: Colors.warning,
  },
  error: {
    backgroundColor: Colors.error,
  },
  accent: {
    backgroundColor: Colors.accent,
  },
});

const textVariantStyles = StyleSheet.create<Record<BadgeStatus, TextStyle>>({
  neutral: {
    color: Colors.textSecondary,
  },
  success: {
    color: Colors.successDark,
  },
  warning: {
    color: Colors.warningDark,
  },
  error: {
    color: Colors.errorDark,
  },
  accent: {
    color: Colors.accent,
  },
});

const textSizeStyles = StyleSheet.create<Record<BadgeSize, TextStyle>>({
  sm: {
    fontSize: Typography.sizes.xxs,
  },
  md: {
    fontSize: Typography.sizes.xs,
  },
});
