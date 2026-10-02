import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Layout } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  testID,
}) => {
  const isInteractive = !disabled && !loading;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      onPress={isInteractive ? onPress : undefined}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        pressed && isInteractive && pressedStyles[variant],
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'primary' || variant === 'danger'
              ? Colors.textInverse
              : Colors.accent
          }
        />
      ) : (
        <View style={styles.contentContainer}>
          {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
          <Text
            style={[
              styles.textBase,
              textSizeStyles[size],
              textVariantStyles[variant],
              disabled && styles.textDisabled,
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
        </View>
      )}
    </Pressable>
  );
};

export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => {
  return <Button {...props} variant="secondary" />;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Layout.touchTargetMin,
  },
  fullWidth: {
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIconContainer: {
    marginRight: Spacing.sm,
  },
  rightIconContainer: {
    marginLeft: Spacing.sm,
  },
  disabled: {
    backgroundColor: Colors.disabled,
    borderColor: Colors.disabledBorder,
  },
  textBase: {
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
  },
  textDisabled: {
    color: Colors.disabledText,
  },
});

const sizeStyles = StyleSheet.create<Record<ButtonSize, ViewStyle>>({
  sm: {
    height: Layout.buttonHeightSm,
    paddingHorizontal: Spacing.md,
  },
  md: {
    height: Layout.buttonHeightMd,
    paddingHorizontal: Spacing.lg,
  },
  lg: {
    height: Layout.buttonHeightLg,
    paddingHorizontal: Spacing.xl,
  },
});

const variantStyles = StyleSheet.create<Record<ButtonVariant, ViewStyle>>({
  primary: {
    backgroundColor: Colors.accent,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  secondary: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outline: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  danger: {
    backgroundColor: Colors.error,
    borderWidth: 1,
    borderColor: Colors.error,
  },
});

const pressedStyles = StyleSheet.create<Record<ButtonVariant, ViewStyle>>({
  primary: {
    backgroundColor: Colors.accentPressed,
    borderColor: Colors.accentPressed,
  },
  secondary: {
    backgroundColor: Colors.border,
  },
  outline: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.accent,
  },
  ghost: {
    backgroundColor: Colors.accentLight,
  },
  danger: {
    backgroundColor: Colors.errorDark,
    borderColor: Colors.errorDark,
  },
});

const textSizeStyles = StyleSheet.create<Record<ButtonSize, TextStyle>>({
  sm: {
    fontSize: Typography.sizes.sm,
  },
  md: {
    fontSize: Typography.sizes.md,
  },
  lg: {
    fontSize: Typography.sizes.lg,
  },
});

const textVariantStyles = StyleSheet.create<Record<ButtonVariant, TextStyle>>({
  primary: {
    color: Colors.textInverse,
  },
  secondary: {
    color: Colors.textPrimary,
  },
  outline: {
    color: Colors.textPrimary,
  },
  ghost: {
    color: Colors.accent,
  },
  danger: {
    color: Colors.textInverse,
  },
});
