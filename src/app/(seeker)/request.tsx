import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import {
  Header,
  Card,
  Avatar,
  StatusBadge,
  TextInput,
  Button,
  LoadingIndicator,
  ErrorMessage,
  EmptyState,
} from '@/components';
import {
  getVerifiedWorkerById,
  getCategoryIconName,
  createServiceRequest,
} from '@/services';
import {
  WorkerDiscoveryProfile,
  WorkerService,
} from '@/types';

// Preset schedule options generating safe ISO timestamps
interface SchedulePreset {
  id: string;
  label: string;
  sublabel: string;
  getISO: () => string | null;
}

const SCHEDULE_PRESETS: SchedulePreset[] = [
  {
    id: 'asap',
    label: 'Flexible / ASAP',
    sublabel: 'Earliest available',
    getISO: () => null,
  },
  {
    id: 'today_pm',
    label: 'Today (Afternoon)',
    sublabel: '3:00 PM',
    getISO: () => {
      const d = new Date();
      d.setHours(15, 0, 0, 0);
      return d.toISOString();
    },
  },
  {
    id: 'tomorrow_am',
    label: 'Tomorrow (Morning)',
    sublabel: '9:00 AM',
    getISO: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d.toISOString();
    },
  },
  {
    id: 'tomorrow_pm',
    label: 'Tomorrow (Afternoon)',
    sublabel: '2:00 PM',
    getISO: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(14, 0, 0, 0);
      return d.toISOString();
    },
  },
  {
    id: 'next_day_am',
    label: 'In 2 Days',
    sublabel: '9:00 AM',
    getISO: () => {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      d.setHours(9, 0, 0, 0);
      return d.toISOString();
    },
  },
];

export default function SeekerRequestServiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ workerId?: string; categoryId?: string }>();

  // State
  const [worker, setWorker] = useState<WorkerDiscoveryProfile | null>(null);
  const [loadingWorker, setLoadingWorker] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [selectedSchedulePreset, setSelectedSchedulePreset] = useState<string>('asap');
  const [preferredScheduleISO, setPreferredScheduleISO] = useState<string | null>(null);

  // Validation & Submission State
  const [errors, setErrors] = useState<{
    category?: string;
    description?: string;
    address?: string;
    general?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch verified worker data
  const loadWorker = useCallback(async () => {
    if (!params.workerId) {
      setLoadError('Worker ID is missing. Please select a skilled worker from the directory.');
      setLoadingWorker(false);
      return;
    }

    setLoadingWorker(true);
    setLoadError(null);

    try {
      const { data, error } = await getVerifiedWorkerById(params.workerId);

      if (error) {
        setLoadError(error.message);
      } else if (!data) {
        setLoadError('This worker profile was not found or is no longer verified.');
      } else {
        setWorker(data);

        // Pre-select category if matching param exists and is offered by worker
        const offeredServices = data.services || [];
        if (params.categoryId && offeredServices.some((s) => s.category_id === params.categoryId)) {
          setSelectedCategoryId(params.categoryId);
        } else if (offeredServices.length === 1) {
          // If worker offers exactly 1 service, auto-select it
          setSelectedCategoryId(offeredServices[0].category_id);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to load worker profile.';
      setLoadError(message);
    } finally {
      setLoadingWorker(false);
    }
  }, [params.workerId, params.categoryId]);

  useEffect(() => {
    loadWorker();
  }, [loadWorker]);

  // Selected category object
  const selectedService: WorkerService | undefined = useMemo(() => {
    if (!worker?.services) return undefined;
    return worker.services.find((s) => s.category_id === selectedCategoryId);
  }, [worker, selectedCategoryId]);

  // Handle schedule preset change
  const handleSelectSchedulePreset = (preset: SchedulePreset) => {
    setSelectedSchedulePreset(preset.id);
    setPreferredScheduleISO(preset.getISO());
  };

  // Validate form client-side
  const validateForm = (): boolean => {
    const newErrors: {
      category?: string;
      description?: string;
      address?: string;
      general?: string;
    } = {};

    if (!selectedCategoryId) {
      newErrors.category = 'Please choose a service category offered by this worker.';
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      newErrors.description = 'Please describe the repair or service needed.';
    } else if (trimmedDesc.length < 5) {
      newErrors.description = 'Description must be at least 5 characters long.';
    } else if (trimmedDesc.length > 2000) {
      newErrors.description = 'Description cannot exceed 2000 characters.';
    }

    const trimmedAddress = serviceAddress.trim();
    if (!trimmedAddress) {
      newErrors.address = 'Please enter your service address or purok in Tinago.';
    } else if (trimmedAddress.length < 5) {
      newErrors.address = 'Service address must be at least 5 characters long.';
    } else if (trimmedAddress.length > 500) {
      newErrors.address = 'Service address cannot exceed 500 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit request
  const handleSubmit = async () => {
    if (submitting) return;

    if (!worker) {
      setErrors({ general: 'Worker information is not available.' });
      return;
    }

    if (worker.availability_status !== 'available') {
      setErrors({
        general: 'This worker is currently unavailable and cannot accept service requests at this time.',
      });
      return;
    }

    if (!validateForm()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const { data, error } = await createServiceRequest({
        workerId: worker.worker_id,
        categoryId: selectedCategoryId,
        description: description.trim(),
        serviceAddress: serviceAddress.trim(),
        preferredSchedule: preferredScheduleISO,
      });

      if (error) {
        setErrors({ general: error.message });
        setSubmitting(false);
        return;
      }

      if (data) {
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred while submitting your request.';
      setErrors({ general: message });
    } finally {
      setSubmitting(false);
    }
  };

  // ================= RENDER ================= //

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <Header
        title="Request Service"
        subtitle={worker ? (worker.full_name || worker.username) : undefined}
        onBack={() => router.back()}
        showBorder
      />

      {/* Loading worker state */}
      {loadingWorker && (
        <View style={styles.centerContainer}>
          <LoadingIndicator size="large" message="Loading worker profile..." />
        </View>
      )}

      {/* Load error state */}
      {!loadingWorker && loadError && (
        <View style={styles.centerContainer}>
          <ErrorMessage message={loadError} onRetry={loadWorker} retryText="Try Again" />
        </View>
      )}

      {/* Worker not found */}
      {!loadingWorker && !loadError && !worker && (
        <View style={styles.centerContainer}>
          <EmptyState
            iconName="person-remove-outline"
            title="Worker Not Found"
            description="The requested skilled worker is either unavailable or has not completed official verification."
            actionText="Back to Worker Directory"
            onActionPress={() => router.back()}
          />
        </View>
      )}

      {/* Success State */}
      {!loadingWorker && !loadError && worker && isSuccess && (
        <ScrollView contentContainerStyle={styles.successContainer}>
          <View style={styles.successIconWrapper}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
          </View>

          <Text style={styles.successTitle}>Service Request Sent!</Text>
          <Text style={styles.successMessage}>
            Your request has been delivered to{' '}
            <Text style={styles.boldText}>{worker.full_name || worker.username}</Text> for{' '}
            <Text style={styles.boldText}>
              {selectedService?.category?.name || 'the requested service'}
            </Text>
            .
          </Text>

          <Card variant="outlined" style={styles.successSummaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Status</Text>
              <StatusBadge label="Pending Worker Review" status="warning" size="sm" showDot />
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Location</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {serviceAddress}
              </Text>
            </View>

            {preferredScheduleISO ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Schedule</Text>
                <Text style={styles.summaryValue}>
                  {new Date(preferredScheduleISO).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ) : (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Schedule</Text>
                <Text style={styles.summaryValue}>Flexible / ASAP</Text>
              </View>
            )}
          </Card>

          <View style={styles.successActions}>
            <Button
              title="View My Requests"
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => router.replace('/(seeker)/requests')}
            />
            <Button
              title="Back to Worker Directory"
              variant="outline"
              size="md"
              fullWidth
              onPress={() => router.replace('/(seeker)/search')}
              style={{ marginTop: Spacing.sm }}
            />
          </View>
        </ScrollView>
      )}

      {/* Main Request Form */}
      {!loadingWorker && !loadError && worker && !isSuccess && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.formContent}
        >
          {/* General submission error banner */}
          {errors.general && (
            <ErrorMessage message={errors.general} style={styles.generalErrorBanner} />
          )}

          {/* Worker Unavailable Warning Banner */}
          {worker.availability_status !== 'available' && (
            <View style={styles.unavailableBanner}>
              <Ionicons name="alert-circle" size={20} color={Colors.warningDark} />
              <View style={styles.unavailableTextGroup}>
                <Text style={styles.unavailableTitle}>Worker Unavailable</Text>
                <Text style={styles.unavailableMessage}>
                  {worker.full_name || worker.username} is currently set to unavailable. You
                  cannot submit a service request right now.
                </Text>
              </View>
            </View>
          )}

          {/* Worker Summary Card */}
          <Card variant="outlined" style={styles.workerSummaryCard}>
            <View style={styles.workerSummaryTop}>
              <Avatar
                name={worker.full_name || worker.username}
                size="lg"
                isVerified={worker.verification_status === 'verified'}
              />

              <View style={styles.workerSummaryInfo}>
                <Text style={styles.workerSummaryName} numberOfLines={1}>
                  {worker.full_name || worker.username}
                </Text>
                <Text style={styles.workerSummaryHandle}>@{worker.username}</Text>

                <View style={styles.workerBadgesRow}>
                  <StatusBadge
                    label={worker.availability_status === 'available' ? 'Available' : 'Unavailable'}
                    status={worker.availability_status === 'available' ? 'success' : 'neutral'}
                    size="sm"
                    showDot
                  />
                  <StatusBadge label="Verified Worker" status="success" size="sm" />
                </View>
              </View>
            </View>

            {/* Worker Area & Experience */}
            <View style={styles.workerMetaRow}>
              {worker.experience_years !== null && worker.experience_years !== undefined && (
                <View style={styles.workerMetaItem}>
                  <Ionicons name="ribbon-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.workerMetaText}>
                    {worker.experience_years} {worker.experience_years === 1 ? 'yr' : 'yrs'} exp
                  </Text>
                </View>
              )}

              {worker.service_area && (
                <View style={styles.workerMetaItem}>
                  <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.workerMetaText} numberOfLines={1}>
                    {worker.service_area}
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {/* Section: Service Category Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                Service Needed <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <Text style={styles.sectionSubtitle}>Services offered by this worker</Text>
            </View>

            {worker.services && worker.services.length > 0 ? (
              <View style={styles.categoryChipsContainer}>
                {worker.services.map((service) => {
                  const isSelected = selectedCategoryId === service.category_id;
                  const categoryName = service.category?.name || 'Service';
                  const iconName = getCategoryIconName(
                    service.category?.icon,
                    service.category?.name
                  );

                  return (
                    <Pressable
                      key={service.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${categoryName}`}
                      onPress={() => {
                        setSelectedCategoryId(service.category_id);
                        if (errors.category) {
                          setErrors((prev) => ({ ...prev, category: undefined }));
                        }
                      }}
                      style={[
                        styles.categorySelectChip,
                        isSelected && styles.categorySelectChipActive,
                      ]}
                    >
                      <Ionicons
                        name={iconName}
                        size={16}
                        color={isSelected ? Colors.textInverse : Colors.accent}
                      />
                      <Text
                        style={[
                          styles.categorySelectChipText,
                          isSelected && styles.categorySelectChipTextActive,
                        ]}
                      >
                        {categoryName}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noServicesText}>
                This worker has not listed specific service categories yet.
              </Text>
            )}

            {errors.category && <Text style={styles.fieldErrorText}>{errors.category}</Text>}
          </View>

          {/* Section: Problem Description */}
          <View style={styles.section}>
            <TextInput
              label="Problem Description"
              required
              multiline
              numberOfLines={4}
              placeholder="Describe the issue in detail. For example: Kitchen sink PVC pipe is leaking under the cabinet whenever the faucet runs..."
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (errors.description) {
                  setErrors((prev) => ({ ...prev, description: undefined }));
                }
              }}
              errorText={errors.description}
              helperText={`${description.trim().length} / 2,000 characters (minimum 5)`}
              editable={!submitting && worker.availability_status === 'available'}
            />
          </View>

          {/* Section: Service Address */}
          <View style={styles.section}>
            <TextInput
              label="Service Address / Location"
              required
              placeholder="e.g. House #14, Lopez Jaena St., Purok 2, Barangay Tinago"
              value={serviceAddress}
              onChangeText={(text) => {
                setServiceAddress(text);
                if (errors.address) {
                  setErrors((prev) => ({ ...prev, address: undefined }));
                }
              }}
              errorText={errors.address}
              helperText="Must be within Barangay Tinago coverage (5–500 characters)"
              editable={!submitting && worker.availability_status === 'available'}
              leftIcon={<Ionicons name="location-outline" size={18} color={Colors.textSecondary} />}
            />
          </View>

          {/* Section: Preferred Schedule (Optional) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferred Schedule (Optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Let the worker know when you are available for service
            </Text>

            <View style={styles.schedulePresetsRow}>
              {SCHEDULE_PRESETS.map((preset) => {
                const isSelected = selectedSchedulePreset === preset.id;
                return (
                  <Pressable
                    key={preset.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Set schedule to ${preset.label}`}
                    onPress={() => handleSelectSchedulePreset(preset)}
                    style={[
                      styles.schedulePresetChip,
                      isSelected && styles.schedulePresetChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.schedulePresetLabel,
                        isSelected && styles.schedulePresetLabelActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                    <Text
                      style={[
                        styles.schedulePresetSublabel,
                        isSelected && styles.schedulePresetSublabelActive,
                      ]}
                    >
                      {preset.sublabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Security & RLS Notice */}
          <View style={styles.securityNoticeCard}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
            <Text style={styles.securityNoticeText}>
              Your request will be submitted directly to this verified worker with pending status.
              Official Barangay Tinago RLS security active.
            </Text>
          </View>

          {/* Submit Button */}
          <View style={styles.submitSection}>
            <Button
              title={
                worker.availability_status !== 'available'
                  ? 'Worker Currently Unavailable'
                  : 'Submit Service Request'
              }
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
              disabled={submitting || worker.availability_status !== 'available'}
              onPress={handleSubmit}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  formContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
    gap: Spacing.lg,
  },
  generalErrorBanner: {
    marginBottom: Spacing.xs,
  },
  unavailableBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  unavailableTextGroup: {
    flex: 1,
  },
  unavailableTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.warningDark,
  },
  unavailableMessage: {
    fontSize: Typography.sizes.xs,
    color: Colors.textPrimary,
    marginTop: 2,
    lineHeight: 18,
  },
  workerSummaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.subtle,
  },
  workerSummaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  workerSummaryInfo: {
    flex: 1,
  },
  workerSummaryName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  workerSummaryHandle: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent,
    fontWeight: Typography.weights.medium,
    marginTop: 1,
  },
  workerBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  workerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  workerMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workerMetaText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  section: {
    gap: Spacing.xs,
  },
  sectionHeaderRow: {
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  requiredAsterisk: {
    color: Colors.error,
  },
  categoryChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  categorySelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  categorySelectChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  categorySelectChipText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  categorySelectChipTextActive: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.bold,
  },
  noServicesText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: Spacing.xs,
  },
  fieldErrorText: {
    fontSize: Typography.sizes.xs,
    color: Colors.error,
    fontWeight: Typography.weights.medium,
    marginTop: 4,
  },
  schedulePresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  schedulePresetChip: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
  },
  schedulePresetChipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  schedulePresetLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  schedulePresetLabelActive: {
    color: Colors.accent,
  },
  schedulePresetSublabel: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  schedulePresetSublabelActive: {
    color: Colors.accent,
  },
  securityNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
  },
  securityNoticeText: {
    flex: 1,
    fontSize: Typography.sizes.xxs,
    color: Colors.successDark,
    lineHeight: 16,
  },
  submitSection: {
    marginTop: Spacing.sm,
  },
  successContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconWrapper: {
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
  },
  successTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  boldText: {
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  successSummaryCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  summaryValue: {
    fontSize: Typography.sizes.xs,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
    maxWidth: '60%',
    textAlign: 'right',
  },
  successActions: {
    width: '100%',
    marginTop: Spacing.xl,
  },
});
