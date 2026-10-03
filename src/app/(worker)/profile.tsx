import React, { useState, useEffect, useCallback } from 'react';
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
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import {
  Avatar,
  Button,
  SecondaryButton,
  Card,
  TextInput,
  StatusBadge,
  ErrorMessage,
  LoadingIndicator,
  EmptyState,
  SupabaseConnectionCard,
} from '@/components';
import { useRole } from '@/contexts/RoleContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  getWorkerProfile,
  createWorkerProfile,
  updateWorkerProfile,
  validateExperienceYears,
} from '@/services';
import {
  WorkerProfile,
  WorkerAvailabilityStatus,
  WorkerVerificationStatus,
} from '@/types';

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

const getVerificationBadge = (status?: WorkerVerificationStatus) => {
  switch (status) {
    case 'verified':
      return { label: 'Verified', status: 'success' as const };
    case 'rejected':
      return { label: 'Rejected', status: 'error' as const };
    case 'suspended':
      return { label: 'Suspended', status: 'error' as const };
    case 'pending':
    default:
      return { label: 'Pending Verification', status: 'warning' as const };
  }
};

export default function WorkerProfileScreen() {
  const router = useRouter();
  const { switchToSeeker } = useRole();
  const { user, profile, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  // Worker profile state
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Editable form state
  const [isSettingUp, setIsSettingUp] = useState<boolean>(false);
  const [bio, setBio] = useState<string>('');
  const [experienceYears, setExperienceYears] = useState<string>('');
  const [serviceArea, setServiceArea] = useState<string>('');
  const [availabilityStatus, setAvailabilityStatus] = useState<WorkerAvailabilityStatus>('available');

  // Submission feedback state
  const [saving, setSaving] = useState<boolean>(false);
  const [experienceError, setExperienceError] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    const { data, error } = await getWorkerProfile(user.id);

    if (error) {
      setLoadError(error.message);
    } else {
      setWorkerProfile(data);
      if (data) {
        setBio(data.bio || '');
        setExperienceYears(
          data.experience_years !== null && data.experience_years !== undefined
            ? String(data.experience_years)
            : ''
        );
        setServiceArea(data.service_area || '');
        setAvailabilityStatus(data.availability_status || 'available');
      } else {
        setBio('');
        setExperienceYears('');
        setServiceArea('Barangay Tinago, Cebu City');
        setAvailabilityStatus('available');
      }
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!user?.id) {
      setFormError('Authentication required. Please sign in again.');
      return;
    }

    const expValidation = validateExperienceYears(experienceYears);
    if (!expValidation.isValid) {
      setExperienceError(expValidation.error || 'Invalid experience years.');
      return;
    }

    setExperienceError('');
    setFormError(null);
    setSuccessMessage(null);
    setSaving(true);

    try {
      if (workerProfile) {
        // Update existing profile
        const { data, error } = await updateWorkerProfile(user.id, {
          bio: bio.trim() || null,
          experience_years: expValidation.value,
          service_area: serviceArea.trim() || null,
          availability_status: availabilityStatus,
        });

        if (error) {
          setFormError(error.message);
        } else if (data) {
          setWorkerProfile(data);
          setSuccessMessage('Worker profile updated successfully.');
        }
      } else {
        // Create initial worker profile
        const { data, error } = await createWorkerProfile(user.id, {
          bio: bio.trim() || null,
          experience_years: expValidation.value,
          service_area: serviceArea.trim() || null,
          availability_status: availabilityStatus,
        });

        if (error) {
          setFormError(error.message);
        } else if (data) {
          setWorkerProfile(data);
          setIsSettingUp(false);
          setSuccessMessage('Worker profile created successfully.');
        }
      }
    } finally {
      setSaving(false);
    }
  };

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
    : '@worker';

  const displayName =
    profile?.full_name ||
    profile?.username ||
    user?.user_metadata?.username ||
    (user?.email ? user.email.split('@')[0] : 'FixMo Worker');

  const displayEmail = user?.email || '';
  const displayRole = profile?.role === 'worker' ? 'Skilled Worker' : 'Skilled Worker';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Worker Profile Header */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Avatar name={displayName} size="xl" isVerified={workerProfile?.verification_status === 'verified'} />
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameBadgeRow}>
              <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
              <StatusBadge
                label={getVerificationBadge(workerProfile?.verification_status).label}
                status={getVerificationBadge(workerProfile?.verification_status).status}
                size="sm"
                showDot
              />
            </View>
            <Text style={styles.userHandle}>{usernameHandle}</Text>
            <Text style={styles.userRole}>
              {displayRole}
              {workerProfile?.service_area ? ` • ${workerProfile.service_area}` : ''}
              {workerProfile?.experience_years !== null && workerProfile?.experience_years !== undefined
                ? ` • ${workerProfile.experience_years} yrs exp`
                : ''}
            </Text>
            {displayEmail ? <Text style={styles.userEmail}>{displayEmail}</Text> : null}
          </View>
        </View>

        {/* Section: Worker Profile Foundation */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Worker Profile</Text>

          {/* Loading State */}
          {loading && (
            <Card variant="outlined" style={styles.stateCard}>
              <LoadingIndicator size="small" message="Loading worker profile..." />
            </Card>
          )}

          {/* Load Error State */}
          {!loading && loadError && (
            <Card variant="outlined" style={styles.stateCard}>
              <ErrorMessage
                message={loadError}
                onRetry={loadProfile}
                retryText="Try Again"
              />
            </Card>
          )}

          {/* Empty / Initial Setup State */}
          {!loading && !loadError && !workerProfile && (
            <>
              {!isSettingUp ? (
                <Card variant="outlined" style={styles.emptyCard}>
                  <EmptyState
                    iconName="construct-outline"
                    title="No Worker Profile Set Up"
                    description="Set up your profile to receive service inquiries and list your experience in Barangay Tinago."
                    actionText="Set Up Worker Profile"
                    onActionPress={() => setIsSettingUp(true)}
                  />
                </Card>
              ) : (
                <Card variant="outlined" style={styles.formCard}>
                  <Text style={styles.cardHeaderTitle}>Create Worker Profile</Text>
                  <Text style={styles.cardHeaderSubtitle}>
                    Enter your details to create your skilled worker listing in Barangay Tinago.
                  </Text>

                  {formError && <ErrorMessage message={formError} style={styles.messageBanner} />}

                  <TextInput
                    label="Bio"
                    placeholder="Describe your specialties, background, and trades..."
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    numberOfLines={3}
                    containerStyle={styles.fieldSpacing}
                  />

                  <TextInput
                    label="Years of Experience"
                    placeholder="e.g. 5"
                    value={experienceYears}
                    onChangeText={(val) => {
                      setExperienceYears(val);
                      if (experienceError) setExperienceError('');
                    }}
                    keyboardType="numeric"
                    errorText={experienceError}
                    helperText="Whole number of years (optional, 0 or greater)"
                    containerStyle={styles.fieldSpacing}
                  />

                  <TextInput
                    label="Service Area"
                    placeholder="e.g. Barangay Tinago, Purok 1-4"
                    value={serviceArea}
                    onChangeText={setServiceArea}
                    helperText="Puroks or coverage area in Tinago"
                    containerStyle={styles.fieldSpacing}
                  />

                  {/* Availability Control */}
                  <View style={styles.fieldSpacing}>
                    <Text style={styles.controlLabel}>Availability Status</Text>
                    <View style={styles.availabilityRow}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Set status to Available"
                        onPress={() => setAvailabilityStatus('available')}
                        style={[
                          styles.availabilityOption,
                          availabilityStatus === 'available' && styles.availabilityOptionSelectedAvailable,
                        ]}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={availabilityStatus === 'available' ? Colors.success : Colors.textTertiary}
                        />
                        <Text
                          style={[
                            styles.availabilityOptionText,
                            availabilityStatus === 'available' && styles.availabilityOptionTextSelected,
                          ]}
                        >
                          Available
                        </Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Set status to Unavailable"
                        onPress={() => setAvailabilityStatus('unavailable')}
                        style={[
                          styles.availabilityOption,
                          availabilityStatus === 'unavailable' && styles.availabilityOptionSelectedUnavailable,
                        ]}
                      >
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color={availabilityStatus === 'unavailable' ? Colors.error : Colors.textTertiary}
                        />
                        <Text
                          style={[
                            styles.availabilityOptionText,
                            availabilityStatus === 'unavailable' && styles.availabilityOptionTextSelected,
                          ]}
                        >
                          Unavailable
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Read-Only Pending Notice */}
                  <View style={styles.pendingNoticeBox}>
                    <Ionicons name="information-circle-outline" size={18} color={Colors.warningDark} />
                    <Text style={styles.pendingNoticeText}>
                      Verification Status will start as <Text style={{ fontWeight: '700' }}>Pending</Text> until reviewed by Barangay officials.
                    </Text>
                  </View>

                  <View style={styles.formButtonRow}>
                    <Button
                      title={saving ? 'Creating...' : 'Create Worker Profile'}
                      loading={saving}
                      onPress={handleSave}
                      style={styles.flexButton}
                    />
                    <SecondaryButton
                      title="Cancel"
                      disabled={saving}
                      onPress={() => {
                        setIsSettingUp(false);
                        setFormError(null);
                        setExperienceError('');
                      }}
                      style={styles.cancelButton}
                    />
                  </View>
                </Card>
              )}
            </>
          )}

          {/* Active Worker Profile Edit Card */}
          {!loading && !loadError && workerProfile && (
            <Card variant="outlined" style={styles.formCard}>
              {/* Read-only Verification Status Banner */}
              <View style={styles.verificationBanner}>
                <View style={styles.verificationTopRow}>
                  <View style={styles.verificationTitleGroup}>
                    <Ionicons name="shield-checkmark" size={18} color={Colors.accent} />
                    <Text style={styles.verificationTitle}>Verification Status</Text>
                  </View>
                  <StatusBadge
                    label={getVerificationBadge(workerProfile.verification_status).label}
                    status={getVerificationBadge(workerProfile.verification_status).status}
                    size="sm"
                    showDot
                  />
                </View>
                <Text style={styles.verificationSubtitle}>
                  Managed by Barangay Tinago administration (read-only)
                </Text>
              </View>

              {formError && <ErrorMessage message={formError} style={styles.messageBanner} />}

              {successMessage && (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                  <Text style={styles.successBannerText}>{successMessage}</Text>
                </View>
              )}

              {/* Bio Input */}
              <TextInput
                label="Bio"
                placeholder="Describe your specialties, background, and trades..."
                value={bio}
                onChangeText={(val) => {
                  setBio(val);
                  setSuccessMessage(null);
                }}
                multiline
                numberOfLines={3}
                containerStyle={styles.fieldSpacing}
              />

              {/* Years of Experience Input */}
              <TextInput
                label="Years of Experience"
                placeholder="e.g. 5"
                value={experienceYears}
                onChangeText={(val) => {
                  setExperienceYears(val);
                  setSuccessMessage(null);
                  if (experienceError) setExperienceError('');
                }}
                keyboardType="numeric"
                errorText={experienceError}
                helperText="Whole number of years (0 or greater)"
                containerStyle={styles.fieldSpacing}
              />

              {/* Service Area Input */}
              <TextInput
                label="Service Area"
                placeholder="e.g. Barangay Tinago, Purok 1-4"
                value={serviceArea}
                onChangeText={(val) => {
                  setServiceArea(val);
                  setSuccessMessage(null);
                }}
                helperText="Service coverage in Barangay Tinago"
                containerStyle={styles.fieldSpacing}
              />

              {/* Availability Control */}
              <View style={styles.fieldSpacing}>
                <Text style={styles.controlLabel}>Availability Status</Text>
                <View style={styles.availabilityRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Set status to Available"
                    onPress={() => {
                      setAvailabilityStatus('available');
                      setSuccessMessage(null);
                    }}
                    style={[
                      styles.availabilityOption,
                      availabilityStatus === 'available' && styles.availabilityOptionSelectedAvailable,
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={availabilityStatus === 'available' ? Colors.success : Colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.availabilityOptionText,
                        availabilityStatus === 'available' && styles.availabilityOptionTextSelected,
                      ]}
                    >
                      Available
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Set status to Unavailable"
                    onPress={() => {
                      setAvailabilityStatus('unavailable');
                      setSuccessMessage(null);
                    }}
                    style={[
                      styles.availabilityOption,
                      availabilityStatus === 'unavailable' && styles.availabilityOptionSelectedUnavailable,
                    ]}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={availabilityStatus === 'unavailable' ? Colors.error : Colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.availabilityOptionText,
                        availabilityStatus === 'unavailable' && styles.availabilityOptionTextSelected,
                      ]}
                    >
                      Unavailable
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Button
                title={saving ? 'Saving...' : 'Update Worker Profile'}
                loading={saving}
                onPress={handleSave}
                fullWidth
                style={styles.saveButton}
              />
            </Card>
          )}
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
    marginRight: Spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    gap: Spacing.xs,
  },
  userName: {
    flex: 1,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  userHandle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.accent,
    marginBottom: 2,
  },
  userRole: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  userEmail: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textTertiary,
    marginTop: 2,
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
  stateCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  emptyCard: {
    paddingVertical: Spacing.md,
  },
  formCard: {
    padding: Spacing.lg,
  },
  cardHeaderTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cardHeaderSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  fieldSpacing: {
    marginBottom: Spacing.md,
  },
  controlLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  availabilityRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  availabilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSecondary,
  },
  availabilityOptionSelectedAvailable: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  availabilityOptionSelectedUnavailable: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  availabilityOptionText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  availabilityOptionTextSelected: {
    color: Colors.textPrimary,
  },
  verificationBanner: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  verificationTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  verificationTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  verificationTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  verificationSubtitle: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textTertiary,
  },
  pendingNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.warningLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  pendingNoticeText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.warningDark,
    lineHeight: 16,
  },
  messageBanner: {
    marginBottom: Spacing.md,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.successLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  successBannerText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.successDark,
  },
  formButtonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  flexButton: {
    flex: 2,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    marginTop: Spacing.xs,
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
