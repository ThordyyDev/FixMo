import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Avatar, Button, StatusBadge, SupabaseConnectionCard } from '@/components';
import { useRole } from '@/contexts/RoleContext';
import { useAuth } from '@/contexts/AuthContext';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  badge?: string;
  onPress: () => void;
  showDivider?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  badge,
  onPress,
  showDivider = true,
}) => (
  <>
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={20} color={Colors.textSecondary} />
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
      <View style={styles.menuRight}>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
      </View>
    </Pressable>
    {showDivider && <View style={styles.menuDivider} />}
  </>
);

export default function WorkerProfileScreen() {
  const router = useRouter();
  const { switchToSeeker } = useRole();
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  const displayName = user?.email ? user.email.split('@')[0] : 'Mario Batumbakal';
  const displayEmail = user?.email || 'mario.worker@example.com';
  const skills = ['Plumbing', 'Electrical', 'Appliance Repair', 'Pipe Fitting'];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Worker Profile Header */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Avatar name={displayName} size="xl" isVerified />
            <View style={styles.editPencilBadge}>
              <Ionicons name="pencil" size={12} color={Colors.textPrimary} />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameBadgeRow}>
              <Text style={styles.userName}>{displayName}</Text>
              <StatusBadge label="Verified Worker" status="success" size="sm" showDot />
            </View>
            <Text style={styles.userRole}>Master Plumber & Electrician • Purok 4</Text>
            <Text style={styles.userPhone}>{displayEmail}</Text>
          </View>
        </View>

        {/* Skills & Badges */}
        <View style={styles.skillsSection}>
          <Text style={styles.skillsHeading}>Verified Skills & Trades</Text>
          <View style={styles.skillsRow}>
            {skills.map((skill) => (
              <View key={skill} style={styles.skillPill}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.success} />
                <Text style={styles.skillPillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Switch to Seeker Mode Callout Card */}
        <View style={styles.switchRoleCard}>
          <View style={styles.switchRoleHeader}>
            <View style={styles.switchRoleIconBox}>
              <Ionicons name="person" size={22} color={Colors.accent} />
            </View>
            <View style={styles.switchRoleText}>
              <Text style={styles.switchRoleTitle}>Need home repairs yourself?</Text>
              <Text style={styles.switchRoleDesc}>
                Switch to Service Seeker Mode to search workers and run AI diagnostic camera scans.
              </Text>
            </View>
          </View>
          <Button
            title="Switch to Service Seeker Mode"
            variant="outline"
            size="md"
            onPress={switchToSeeker}
            leftIcon={<Ionicons name="swap-horizontal" size={18} color={Colors.textPrimary} />}
          />
        </View>

        {/* Section: Backend & Database Connection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Backend Connection</Text>
          <SupabaseConnectionCard />
        </View>

        {/* Section: Worker Management */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Worker Management</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="calendar-outline"
              title="Work Hours & Availability"
              onPress={() => {}}
            />
            <MenuItem
              icon="document-text-outline"
              title="Barangay Tinago Clearance"
              badge="Active"
              onPress={() => {}}
            />
            <MenuItem
              icon="cash-outline"
              title="Service Rates & Invoices"
              onPress={() => {}}
            />
            <MenuItem
              icon="star-outline"
              title="Client Reviews & Ratings (4.9 ★)"
              showDivider={false}
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Section: General */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>General & Support</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="color-palette-outline"
              title="Design System & UI Components"
              badge="Demo"
              onPress={() => router.push('/design-system')}
            />
            <MenuItem
              icon="help-circle-outline"
              title="Worker Community Hotline"
              onPress={() => {}}
            />
            <MenuItem
              icon="settings-outline"
              title="Settings & Privacy"
              onPress={() => {}}
            />
            <MenuItem
              icon="information-circle-outline"
              title="About FixMo Capstone Project"
              showDivider={false}
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <Button
            title={signingOut ? 'Signing Out...' : 'Sign Out'}
            variant="outline"
            size="md"
            loading={signingOut}
            onPress={handleSignOut}
            fullWidth
            leftIcon={<Ionicons name="log-out-outline" size={18} color={Colors.error} />}
            textStyle={{ color: Colors.error }}
            style={{ borderColor: Colors.errorBorder }}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>FixMo App • Worker Experience</Text>
          <Text style={styles.footerSubtext}>Barangay Tinago Skilled Worker Network</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingBottom: Spacing.huge,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: Spacing.lg,
  },
  editPencilBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.surface,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileInfo: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  userName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  userRole: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  userPhone: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  skillsSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  skillsHeading: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skillPillText: {
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  switchRoleCard: {
    margin: Spacing.lg,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  switchRoleHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  switchRoleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  switchRoleText: {
    flex: 1,
  },
  switchRoleTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  switchRoleDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  sectionContainer: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeading: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  menuGroup: {
    backgroundColor: Colors.surface,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  menuItemPressed: {
    opacity: 0.7,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuTitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  badge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginRight: 4,
  },
  badgeText: {
    color: Colors.successDark,
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.bold,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 36,
  },
  signOutContainer: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  footer: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  footerText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
  },
  footerSubtext: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});
