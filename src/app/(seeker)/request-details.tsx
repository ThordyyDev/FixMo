import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
} from '@/constants/theme';
import {
  Header,
  StatusBadge,
  BadgeStatus,
  Avatar,
  Button,
  Card,
  LoadingIndicator,
  ErrorMessage,
} from '@/components';
import {
  getServiceRequestById,
  SERVICE_REQUEST_STATUS_LABELS,
} from '@/services/serviceRequests';
import { getVerifiedWorkerById } from '@/services/workerDiscovery';
import {
  ServiceRequest,
  ServiceRequestStatus,
  WorkerDiscoveryProfile,
} from '@/types';

/**
 * Maps database service request status to StatusBadge variant.
 */
const getBadgeVariant = (status: ServiceRequestStatus): BadgeStatus => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'accepted':
    case 'on_the_way':
    case 'arrived':
    case 'in_service':
      return 'accent';
    case 'rejected':
      return 'error';
    case 'cancelled':
      return 'neutral';
    default:
      return 'neutral';
  }
};

/**
 * Returns a human-friendly narrative for each status.
 */
const getStatusDescription = (status: ServiceRequestStatus): string => {
  switch (status) {
    case 'pending':
      return 'Your request has been submitted and is awaiting confirmation from the worker.';
    case 'accepted':
      return 'The worker has accepted your request and is preparing for the appointment.';
    case 'on_the_way':
      return 'The technician is traveling to your service address in Barangay Tinago.';
    case 'arrived':
      return 'The worker has arrived at your location.';
    case 'in_service':
      return 'Repair or installation work is currently in progress.';
    case 'completed':
      return 'The service has been completed and verified.';
    case 'rejected':
      return 'The worker was unable to accept this request at this time.';
    case 'cancelled':
      return 'This request was cancelled.';
    default:
      return 'Status update pending.';
  }
};

/**
 * Formats ISO timestamp strings into readable dates.
 */
const formatDateTime = (isoString?: string | null): string => {
  if (!isoString) return 'Flexible / ASAP';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
};

export default function SeekerRequestDetailsScreen() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [workerInfo, setWorkerInfo] = useState<WorkerDiscoveryProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!requestId || typeof requestId !== 'string') {
      setError('Invalid or missing service request ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: reqError } = await getServiceRequestById(requestId);

      if (reqError) {
        setError(reqError.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Service request not found or you do not have permission to view it.');
        setLoading(false);
        return;
      }

      setRequest(data);

      // Attempt to load rich worker discovery profile for name & avatar
      if (data.worker_id) {
        const { data: workerData } = await getVerifiedWorkerById(data.worker_id);
        if (workerData) {
          setWorkerInfo(workerData);
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load request details.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    let isMounted = true;
    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [fetchDetails]);

  const handleMessagePress = () => {
    const name = workerInfo?.full_name || workerInfo?.username || 'this worker';
    Alert.alert(
      'In-App Messaging',
      `Direct messaging with ${name} is currently unavailable. Chat will be enabled in an upcoming release.`,
      [{ text: 'Got it' }]
    );
  };

  const workerDisplayName =
    workerInfo?.full_name ||
    workerInfo?.username ||
    (request?.worker ? 'Assigned Worker' : 'Technician');

  const isVerifiedWorker =
    workerInfo?.verification_status === 'verified' ||
    request?.worker?.verification_status === 'verified';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <Header
        title="Request Details"
        subtitle={requestId ? `#REQ-${requestId.slice(0, 8).toUpperCase()}` : undefined}
        onBack={() => router.back()}
        showBorder
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <LoadingIndicator size="large" message="Loading request details..." />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <ErrorMessage
            title="Unable to Load Request"
            message={error}
            onRetry={fetchDetails}
            retryText="Retry"
          />
        </View>
      ) : !request ? (
        <View style={styles.errorContainer}>
          <ErrorMessage
            title="Request Not Found"
            message="This service request does not exist or may have been removed."
            onRetry={() => router.back()}
            retryText="Go Back"
          />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Status Banner Card */}
          <Card style={styles.statusCard}>
            <View style={styles.statusHeaderRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {request.category?.name || 'Service Request'}
                </Text>
              </View>
              <StatusBadge
                label={SERVICE_REQUEST_STATUS_LABELS[request.status] || request.status}
                status={getBadgeVariant(request.status)}
                size="md"
                showDot
              />
            </View>
            <Text style={styles.statusDescription}>
              {getStatusDescription(request.status)}
            </Text>
          </Card>

          {/* Problem Description Card */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={18} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Problem Description</Text>
            </View>
            <Text style={styles.bodyText}>{request.description}</Text>
          </Card>

          {/* Service Location Card */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={18} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Service Address</Text>
            </View>
            <Text style={styles.bodyText}>{request.service_address}</Text>
            <Text style={styles.subText}>Barangay Tinago, Cebu City</Text>
          </Card>

          {/* Schedule Card */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={18} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Preferred Schedule</Text>
            </View>
            <Text style={styles.bodyText}>
              {formatDateTime(request.preferred_schedule)}
            </Text>
          </Card>

          {/* Assigned Worker Card */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={18} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Assigned Worker</Text>
            </View>

            <View style={styles.workerRow}>
              <Avatar
                name={workerDisplayName}
                size="lg"
                isVerified={isVerifiedWorker}
              />
              <View style={styles.workerInfo}>
                <View style={styles.workerNameRow}>
                  <Text style={styles.workerName}>{workerDisplayName}</Text>
                  {isVerifiedWorker && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={Colors.accent}
                      style={styles.verifiedIcon}
                    />
                  )}
                </View>
                <Text style={styles.workerSub}>
                  {request.category?.name
                    ? `${request.category.name} Specialist`
                    : 'Skilled Technician'}
                </Text>
                {workerInfo?.service_area && (
                  <Text style={styles.workerMeta}>
                    Area: {workerInfo.service_area}
                  </Text>
                )}
                {workerInfo?.experience_years !== null &&
                  workerInfo?.experience_years !== undefined && (
                    <Text style={styles.workerMeta}>
                      {workerInfo.experience_years} years experience
                    </Text>
                  )}
              </View>
            </View>

            <View style={styles.workerActions}>
              <Button
                title="Message Worker"
                variant="outline"
                size="sm"
                onPress={handleMessagePress}
                style={styles.fullWidth}
              />
            </View>
          </Card>

          {/* Timestamps & Technical Reference */}
          <View style={styles.metaSection}>
            <Text style={styles.metaLine}>
              Request ID: {request.id}
            </Text>
            <Text style={styles.metaLine}>
              Submitted: {formatDateTime(request.created_at)}
            </Text>
            <Text style={styles.metaLine}>
              Last Updated: {formatDateTime(request.updated_at)}
            </Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorContainer: {
    padding: Spacing.lg,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.huge,
  },
  statusCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  categoryBadgeText: {
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  statusDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  sectionCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  bodyText: {
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  subText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  workerInfo: {
    flex: 1,
  },
  workerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workerName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  verifiedIcon: {
    marginLeft: 2,
  },
  workerSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  workerMeta: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  workerActions: {
    marginTop: Spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  metaSection: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  metaLine: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
