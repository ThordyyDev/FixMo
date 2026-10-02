import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Layout } from '@/constants/theme';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showBorder?: boolean;
  style?: StyleProp<ViewStyle>;
  backIconName?: keyof typeof Ionicons.glyphMap;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
  showBorder = false,
  style,
  backIconName = 'chevron-back',
}) => {
  return (
    <View style={[styles.container, showBorder && styles.borderBottom, style]}>
      <View style={styles.leftColumn}>
        {onBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name={backIconName} size={24} color={Colors.textPrimary} />
          </Pressable>
        )}
      </View>

      <View style={styles.centerColumn}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightColumn}>
        {rightAction ? rightAction : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  leftColumn: {
    minWidth: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButton: {
    width: Layout.touchTargetMin,
    height: Layout.touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing.xs,
    borderRadius: 24,
  },
  backButtonPressed: {
    backgroundColor: Colors.surfaceSecondary,
  },
  centerColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  rightColumn: {
    minWidth: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
