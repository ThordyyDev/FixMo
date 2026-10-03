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
  getWorkerServices,
  addWorkerService,
  updateWorkerService,
  deleteWorkerService,
  getServiceCategories,
  getCategoryIconName,
} from '@/services';
import {
  WorkerProfile,
  WorkerAvailabilityStatus,
  WorkerVerificationStatus,
  WorkerService,
  ServiceCategory,
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

  // Editable profile form state
  const [isSettingUp, setIsSettingUp] = useState<boolean>(false);
  const [bio, setBio] = useState<string>('');
  const [experienceYears, setExperienceYears] = useState<string>('');
  const [serviceArea, setServiceArea] = useState<string>('');
  const [availabilityStatus, setAvailabilityStatus] = useState<WorkerAvailabilityStatus>('available');

  // Profile submission feedback state
  const [saving, setSaving] = useState<boolean>(false);
  const [experienceError, setExperienceError] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ==================== WORKER SERVICES STATE ====================
  const [workerServices, setWorkerServices] = useState<WorkerService[]>([]);
  const [loadingServices, setLoadingServices] = useState<boolean>(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  // Available categories from Supabase public.service_categories
  const [availableCategories, setAvailableCategories] = useState<ServiceCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

  // Add Service Form State
  const [isAddingService, setIsAddingService] = useState<boolean>(false);
  const [newServiceCategoryId, setNewServiceCategoryId] = useState<string>('');
  const [newServiceDescription, setNewServiceDescription] = useState<string>('');
  const [addingService, setAddingService] = useState<boolean>(false);
  const [addServiceError, setAddServiceError] = useState<string | null>(null);

  // Edit Service State
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [editServiceError, setEditServiceError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Load Worker Profile
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

  // Load Worker Services
  const loadServices = useCallback(async () => {
    if (!user?.id) {
      setLoadingServices(false);
      return;
    }

    setLoadingServices(true);
    setServicesError(null);

    const { data, error } = await getWorkerServices(user.id);

    if (error) {
      setServicesError(error.message);
    } else {
      setWorkerServices(data);
    }

    setLoadingServices(false);
  }, [user?.id]);

  // Load Available Service Categories from Supabase
  const loadAvailableCategories = useCallback(async () => {
    setLoadingCategories(true);
    const { data } = await getServiceCategories();
    if (data && data.length > 0) {
      setAvailableCategories(data);
      setNewServiceCategoryId(data[0].id);
    }
    setLoadingCategories(false);
  }, []);

  useEffect(() => {
    loadProfile();
    loadServices();
    loadAvailableCategories();
  }, [loadProfile, loadServices, loadAvailableCategories]);

  // Save / Update Worker Profile
  const handleSaveProfile = async () => {
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

  // Add Worker Service
  const handleAddService = async () => {
    if (!user?.id) {
      setAddServiceError('Authentication required. Please sign in again.');
      return;
    }

    if (!newServiceCategoryId) {
      setAddServiceError('Please select a service category.');
      return;
    }

    // Local check for duplicate category
    const alreadyExists = workerServices.some((s) => s.category_id === newServiceCategoryId);
    if (alreadyExists) {
      setAddServiceError('You already added this service.');
      return;
    }

    setAddingService(true);
    setAddServiceError(null);

    try {
      const { data, error } = await addWorkerService(
        user.id,
        newServiceCategoryId,
        newServiceDescription
      );

      if (error) {
        setAddServiceError(error.message);
      } else if (data) {
        setWorkerServices((prev) => [...prev, data]);
        setIsAddingService(false);
        setNewServiceDescription('');
        // Select next available category if any
        const nextAvail = availableCategories.find(
          (c) => c.id !== data.category_id && !workerServices.some((s) => s.category_id === c.id)
        );
        if (nextAvail) {
          setNewServiceCategoryId(nextAvail.id);
        }
      }
    } finally {
      setAddingService(false);
    }
  };

  // Start Editing a Service
  const handleStartEdit = (service: WorkerService) => {
    setEditingServiceId(service.id);
    setEditingDescription(service.service_description || '');
    setEditServiceError(null);
  };

  // Save Service Edit
  const handleSaveEdit = async (serviceId: string) => {
    if (!user?.id) return;
    setSavingEdit(true);
    setEditServiceError(null);

    try {
      const { data, error } = await updateWorkerService(
        user.id,
        serviceId,
        editingDescription
      );

      if (error) {
        setEditServiceError(error.message);
      } else if (data) {
        setWorkerServices((prev) =>
          prev.map((s) => (s.id === serviceId ? data : s))
        );
        setEditingServiceId(null);
      }
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Worker Service
  const handleDeleteService = async (serviceId: string) => {
    if (!user?.id) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const { success, error } = await deleteWorkerService(user.id, serviceId);
      if (error) {
        setDeleteError(error.message);
      } else if (success) {
        setWorkerServices((prev) => prev.filter((s) => s.id !== serviceId));
        setDeletingServiceId(null);
      }
    } finally {
      setIsDeleting(false);
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
  const displayRole = 'Skilled Worker';

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

        {/* Dynamic Skills Summary */}
        {workerServices.length > 0 && (
          <View style={styles.skillsSummarySection}>
            <Text style={styles.skillsSummaryHeading}>Offered Skills & Trades</Text>
            <View style={styles.skillsSummaryRow}>
              {workerServices.map((ws) => (
                <View key={ws.id} style={styles.skillSummaryPill}>
                  <Ionicons
                    name={getCategoryIconName(ws.category?.icon, ws.category?.name)}
                    size={13}
                    color={Colors.accent}
                  />
                  <Text style={styles.skillSummaryPillText}>{ws.category?.name || 'Service'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

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
                      onPress={handleSaveProfile}
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
                onPress={handleSaveProfile}
                fullWidth
                style={styles.saveButton}
              />
            </Card>
          )}
        </View>

        {/* ==================== MY SERVICES SECTION ==================== */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionHeading}>My Services</Text>
              <Text style={styles.sectionSubheading}>Categories and trades you offer in Tinago</Text>
            </View>
            {!isAddingService && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add service category"
                onPress={() => {
                  setIsAddingService(true);
                  setAddServiceError(null);
                }}
                style={({ pressed }) => [
                  styles.addServicePill,
                  pressed && styles.addServicePillPressed,
                ]}
              >
                <Ionicons name="add" size={16} color={Colors.accent} />
                <Text style={styles.addServicePillText}>Add Service</Text>
              </Pressable>
            )}
          </View>

          {/* Loading Services State */}
          {loadingServices && (
            <Card variant="outlined" style={styles.stateCard}>
              <LoadingIndicator size="small" message="Loading services..." />
            </Card>
          )}

          {/* Services Load Error */}
          {!loadingServices && servicesError && (
            <Card variant="outlined" style={styles.stateCard}>
              <ErrorMessage
                message={servicesError}
                onRetry={loadServices}
                retryText="Try Again"
              />
            </Card>
          )}

          {/* Add Service Form Card */}
          {isAddingService && (
            <Card variant="outlined" style={styles.formCard}>
              <Text style={styles.cardHeaderTitle}>Add Service Category</Text>
              <Text style={styles.cardHeaderSubtitle}>
                Select an active trade category and optionally provide a custom description.
              </Text>

              {addServiceError && <ErrorMessage message={addServiceError} style={styles.messageBanner} />}

              {/* Dynamic Category Selector */}
              <View style={styles.fieldSpacing}>
                <Text style={styles.controlLabel}>Select Category</Text>
                {loadingCategories ? (
                  <LoadingIndicator size="small" message="Loading categories..." />
                ) : (
                  <View style={styles.categoryChipsGrid}>
                    {availableCategories.map((cat) => {
                      const isAlreadyAdded = workerServices.some((s) => s.category_id === cat.id);
                      const isSelected = newServiceCategoryId === cat.id;

                      return (
                        <Pressable
                          key={cat.id}
                          accessibilityRole="button"
                          accessibilityLabel={`Select ${cat.name}`}
                          onPress={() => {
                            setNewServiceCategoryId(cat.id);
                            setAddServiceError(null);
                          }}
                          style={[
                            styles.categorySelectChip,
                            isSelected && styles.categorySelectChipSelected,
                            isAlreadyAdded && styles.categorySelectChipAdded,
                          ]}
                        >
                          <Ionicons
                            name={getCategoryIconName(cat.icon, cat.name)}
                            size={16}
                            color={isSelected ? Colors.accent : isAlreadyAdded ? Colors.textTertiary : Colors.textPrimary}
                          />
                          <Text
                            style={[
                              styles.categorySelectChipText,
                              isSelected && styles.categorySelectChipTextSelected,
                              isAlreadyAdded && styles.categorySelectChipTextAdded,
                            ]}
                            numberOfLines={1}
                          >
                            {cat.name}
                          </Text>
                          {isAlreadyAdded && (
                            <View style={styles.addedSmallBadge}>
                              <Text style={styles.addedSmallBadgeText}>Added</Text>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Service Description Input */}
              <TextInput
                label="Service Description (Optional)"
                placeholder="e.g. Household plumbing repairs, leak fixes, fixture installs..."
                value={newServiceDescription}
                onChangeText={setNewServiceDescription}
                multiline
                numberOfLines={2}
                helperText="Specific details regarding your experience with this service."
                containerStyle={styles.fieldSpacing}
              />

              <View style={styles.formButtonRow}>
                <Button
                  title={addingService ? 'Adding...' : 'Add Service'}
                  loading={addingService}
                  onPress={handleAddService}
                  style={styles.flexButton}
                />
                <SecondaryButton
                  title="Cancel"
                  disabled={addingService}
                  onPress={() => {
                    setIsAddingService(false);
                    setAddServiceError(null);
                  }}
                  style={styles.cancelButton}
                />
              </View>
            </Card>
          )}

          {/* Empty Services State */}
          {!loadingServices && !servicesError && workerServices.length === 0 && !isAddingService && (
            <Card variant="outlined" style={styles.emptyCard}>
              <EmptyState
                iconName="construct-outline"
                title="No services added yet."
                description="Add the trade categories and skills you offer to connect with repair requests in Barangay Tinago."
                actionText="Add Your First Service"
                onActionPress={() => setIsAddingService(true)}
              />
            </Card>
          )}

          {/* Services List */}
          {!loadingServices && !servicesError && workerServices.length > 0 && (
            <View style={styles.servicesList}>
              {deleteError && <ErrorMessage message={deleteError} style={styles.messageBanner} />}

              {workerServices.map((service) => {
                const isEditing = editingServiceId === service.id;
                const isPendingDelete = deletingServiceId === service.id;
                const category = service.category;

                return (
                  <Card key={service.id} variant="outlined" style={styles.serviceItemCard}>
                    {/* Top Row: Category Info & Actions */}
                    <View style={styles.serviceCardTopRow}>
                      <View style={styles.serviceCategoryHeader}>
                        <View style={styles.serviceIconCircle}>
                          <Ionicons
                            name={getCategoryIconName(category?.icon, category?.name)}
                            size={20}
                            color={Colors.accent}
                          />
                        </View>
                        <View style={styles.serviceNameGroup}>
                          <Text style={styles.serviceCategoryName}>
                            {category?.name || 'Service Category'}
                          </Text>
                          {category?.description ? (
                            <Text style={styles.categoryDescText} numberOfLines={2}>
                              {category.description}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      {!isEditing && !isPendingDelete && (
                        <View style={styles.serviceActionsRow}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Edit ${category?.name} service description`}
                            onPress={() => handleStartEdit(service)}
                            style={({ pressed }) => [
                              styles.actionIconButton,
                              pressed && styles.actionIconButtonPressed,
                            ]}
                          >
                            <Ionicons name="pencil" size={17} color={Colors.textSecondary} />
                          </Pressable>

                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Delete ${category?.name} service`}
                            onPress={() => setDeletingServiceId(service.id)}
                            style={({ pressed }) => [
                              styles.actionIconButton,
                              pressed && styles.actionIconButtonPressed,
                            ]}
                          >
                            <Ionicons name="trash-outline" size={17} color={Colors.error} />
                          </Pressable>
                        </View>
                      )}
                    </View>

                    {/* Service Description Display (Read-Only Mode) */}
                    {!isEditing && !isPendingDelete && service.service_description ? (
                      <View style={styles.serviceDescriptionBox}>
                        <Text style={styles.serviceDescriptionLabel}>Your Service Details:</Text>
                        <Text style={styles.serviceDescriptionText}>
                          {service.service_description}
                        </Text>
                      </View>
                    ) : null}

                    {/* Inline Edit Form */}
                    {isEditing && (
                      <View style={styles.inlineEditContainer}>
                        <Text style={styles.inlineEditNotice}>
                          Editing description for {category?.name || 'this service'}.
                        </Text>

                        {editServiceError && (
                          <ErrorMessage message={editServiceError} style={styles.messageBanner} />
                        )}

                        <TextInput
                          placeholder="Update service description..."
                          value={editingDescription}
                          onChangeText={setEditingDescription}
                          multiline
                          numberOfLines={2}
                          containerStyle={styles.fieldSpacing}
                        />

                        <View style={styles.formButtonRow}>
                          <Button
                            title={savingEdit ? 'Saving...' : 'Save Description'}
                            loading={savingEdit}
                            onPress={() => handleSaveEdit(service.id)}
                            size="sm"
                            style={styles.flexButton}
                          />
                          <SecondaryButton
                            title="Cancel"
                            disabled={savingEdit}
                            onPress={() => setEditingServiceId(null)}
                            size="sm"
                            style={styles.cancelButton}
                          />
                        </View>
                      </View>
                    )}

                    {/* Inline Delete Confirmation */}
                    {isPendingDelete && (
                      <View style={styles.deleteConfirmBanner}>
                        <View style={styles.deleteConfirmTextRow}>
                          <Ionicons name="alert-circle" size={18} color={Colors.error} />
                          <Text style={styles.deleteConfirmTitle}>
                            Remove this service?
                          </Text>
                        </View>
                        <Text style={styles.deleteConfirmSubtext}>
                          This will remove {category?.name || 'this service'} from your offerings.
                        </Text>
                        <View style={styles.deleteConfirmButtons}>
                          <SecondaryButton
                            title="Cancel"
                            disabled={isDeleting}
                            onPress={() => setDeletingServiceId(null)}
                            size="sm"
                            style={styles.deleteCancelBtn}
                          />
                          <Button
                            title={isDeleting ? 'Removing...' : 'Remove'}
                            loading={isDeleting}
                            onPress={() => handleDeleteService(service.id)}
                            variant="danger"
                            size="sm"
                            style={styles.deleteConfirmBtn}
                          />
                        </View>
                      </View>
                    )}
                  </Card>
                );
              })}
            </View>
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
  skillsSummarySection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.surfaceSecondary,
  },
  skillsSummaryHeading: {
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  skillsSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  skillSummaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skillSummaryPillText: {
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  sectionContainer: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionHeading: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  sectionSubheading: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  addServicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  addServicePillPressed: {
    opacity: 0.8,
  },
  addServicePillText: {
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
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
    marginBottom: Spacing.md,
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
  categoryChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 4,
  },
  categorySelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSecondary,
  },
  categorySelectChipSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  categorySelectChipAdded: {
    opacity: 0.65,
  },
  categorySelectChipText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  categorySelectChipTextSelected: {
    color: Colors.accent,
    fontWeight: Typography.weights.bold,
  },
  categorySelectChipTextAdded: {
    color: Colors.textTertiary,
  },
  addedSmallBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addedSmallBadgeText: {
    fontSize: 9,
    color: Colors.textTertiary,
    fontWeight: Typography.weights.bold,
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
  servicesList: {
    gap: Spacing.sm,
  },
  serviceItemCard: {
    padding: Spacing.md,
  },
  serviceCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  serviceIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serviceNameGroup: {
    flex: 1,
  },
  serviceCategoryName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  categoryDescText: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 14,
  },
  serviceActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSecondary,
  },
  actionIconButtonPressed: {
    opacity: 0.7,
  },
  serviceDescriptionBox: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  serviceDescriptionLabel: {
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  serviceDescriptionText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  inlineEditContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  inlineEditNotice: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  deleteConfirmBanner: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
  },
  deleteConfirmTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  deleteConfirmTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.errorDark,
  },
  deleteConfirmSubtext: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  deleteCancelBtn: {
    flex: 1,
  },
  deleteConfirmBtn: {
    flex: 1,
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
