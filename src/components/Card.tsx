import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'flat';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'lg',
  onPress,
  style,
  testID,
}) => {
  const isPressable = !!onPress;

  const content = (
    <View
      style={[
        styles.base,
        styles[variant],
        styles[`padding_${padding}` as keyof typeof styles],
        style,
      ]}
    >
      {children}
    </View>
  );

  if (isPressable) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressableContainer,
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  pressableContainer: {
    width: '100%',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  base: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },

  // Variants
  default: {
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  elevated: {
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    ...Shadows.none,
  },
  flat: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 0,
    ...Shadows.none,
  },

  // Paddings
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: Spacing.sm,
  },
  padding_md: {
    padding: Spacing.md,
  },
  padding_lg: {
    padding: Spacing.lg,
  },
});
