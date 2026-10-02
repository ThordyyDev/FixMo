import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

export interface ErrorMessageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  retryText?: string;
  variant?: 'banner' | 'card' | 'inline';
  style?: StyleProp<ViewStyle>;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  title,
  onRetry,
  retryText = 'Retry',
  variant = 'card',
  style,
}) => {
  if (variant === 'inline') {
    return (
      <View style={[styles.inlineContainer, style]}>
        <Ionicons name="alert-circle" size={16} color={Colors.error} />
        <Text style={styles.inlineText}>{message}</Text>
        {onRetry && (
          <Pressable onPress={onRetry} hitSlop={8}>
            <Text style={styles.inlineRetryText}>{retryText}</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.cardContainer,
        variant === 'banner' && styles.bannerContainer,
        style,
      ]}
    >
      <View style={styles.iconWrapper}>
        <Ionicons name="alert-circle" size={22} color={Colors.error} />
      </View>

      <View style={styles.textWrapper}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.message}>{message}</Text>
        {onRetry && (
          <Pressable
            onPress={onRetry}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}
          >
            <Ionicons name="refresh" size={14} color={Colors.errorDark} />
            <Text style={styles.retryButtonText}>{retryText}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  bannerContainer: {
    borderRadius: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  iconWrapper: {
    marginTop: 1,
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.errorDark,
    marginBottom: Spacing.xxs,
  },
  message: {
    fontSize: Typography.sizes.xs,
    color: Colors.errorDark,
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  retryButtonPressed: {
    opacity: 0.7,
  },
  retryButtonText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.errorDark,
    textDecorationLine: 'underline',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginVertical: Spacing.xxs,
  },
  inlineText: {
    fontSize: Typography.sizes.xs,
    color: Colors.error,
    flex: 1,
  },
  inlineRetryText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.errorDark,
    textDecorationLine: 'underline',
  },
});
