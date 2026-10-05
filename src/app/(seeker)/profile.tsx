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
import { Avatar, Button, SupabaseConnectionCard } from '@/components';
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

export default function SeekerProfileScreen() {
  const router = useRouter();
  const { switchToWorker } = useRole();
  const { user, profile, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  const usernameHandle = profile?.username
    ? `@${profile.username}`
    : user?.user_metadata?.username
    ? `@${user.user_metadata.username}`
    : '@seeker';

  const displayName =
    profile?.full_name ||
    profile?.username ||
    user?.user_metadata?.username ||
    (user?.email ? user.email.split('@')[0] : 'Juan Dela Cruz');

  const displayEmail = user?.email || 'juan.delacruz@example.com';
  const displayRole = profile?.role
    ? profile.role === 'seeker'
      ? 'Service Seeker'
      : profile.role === 'worker'
      ? 'Skilled Worker'
      : profile.role
    : 'Service Seeker';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Avatar name={displayName} size="xl" isVerified />
            <View style={styles.editPencilBadge}>
              <Ionicons name="pencil" size={12} color={Colors.textPrimary} />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userHandle}>{usernameHandle}</Text>
            <Text style={styles.userRole}>{displayRole} • Purok 2, Tinago</Text>
            <Text style={styles.userPhone}>{displayEmail}</Text>
          </View>
        </View>

        {/* Switch to Worker Mode Callout Card */}
        <View style={styles.switchRoleCard}>
          <View style={styles.switchRoleHeader}>
            <View style={styles.switchRoleIconBox}>
              <Ionicons name="construct" size={22} color={Colors.accent} />
            </View>
            <View style={styles.switchRoleText}>
              <Text style={styles.switchRoleTitle}>Are you a skilled worker?</Text>
              <Text style={styles.switchRoleDesc}>
                Switch to Worker Mode to receive repair job orders from Barangay Tinago residents.
              </Text>
            </View>
          </View>
          <Button
            title="Switch to Skilled Worker Mode"
            variant="primary"
            size="md"
            onPress={switchToWorker}
            leftIcon={<Ionicons name="swap-horizontal" size={18} color={Colors.textInverse} />}
          />
        </View>

        {/* Administrator Portal Card (Visible only when user holds the admin role) */}
        {profile?.role === 'admin' && (
          <View style={styles.adminPortalCard}>
            <View style={styles.adminPortalHeader}>
              <View style={styles.adminIconBox}>
                <Ionicons name="shield-checkmark" size={22} color={Colors.success} />
              </View>
              <View style={styles.adminTextContainer}>
                <Text style={styles.adminPortalTitle}>Administrator Portal</Text>
                <Text style={styles.adminPortalDesc}>
                  Review worker verification applications, verify credentials, and manage approvals.
                </Text>
              </View>
            </View>
            <Button
              title="Open Worker Approvals"
              variant="outline"
              size="md"
              onPress={() => router.push('/(admin)/verifications')}
              leftIcon={<Ionicons name="shield-outline" size={18} color={Colors.textPrimary} />}
            />
          </View>
        )}

        {/* Section: Backend & Database Connection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Backend Connection</Text>
          <SupabaseConnectionCard />
        </View>

        {/* Section: Account Settings */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Account Settings</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="person-outline"
              title="Personal Information"
              onPress={() => {}}
            />
            <MenuItem
              icon="location-outline"
              title="Saved Tinago Addresses"
              onPress={() => {}}
            />
            <MenuItem
              icon="camera-outline"
              title="My AI Diagnostic Scans"
              onPress={() => {}}
            />
            <MenuItem
              icon="shield-checkmark-outline"
              title="Barangay Resident Verification"
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
              title="Tinago Community Helpdesk"
              onPress={() => {}}
            />
            <MenuItem
              icon="settings-outline"
              title="Settings & Preferences"
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
          <Text style={styles.footerText}>FixMo App • Seeker Experience</Text>
          <Text style={styles.footerSubtext}>Barangay Tinago, Cebu City</Text>
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
    paddingBottom: Spacing.xl,
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
  userName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  userHandle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.accent,
    marginTop: 1,
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
  switchRoleCard: {
    margin: Spacing.lg,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
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
  },
  switchRoleText: {
    flex: 1,
  },
  switchRoleTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
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
    backgroundColor: Colors.accentLight,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginRight: 4,
  },
  badgeText: {
    color: Colors.accent,
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
  adminPortalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  adminPortalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  adminIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminTextContainer: {
    flex: 1,
  },
  adminPortalTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  adminPortalDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
});
