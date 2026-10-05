import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
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
  Avatar,
  StatusBadge,
  BadgeStatus,
  Button,
  EmptyState,
  ErrorMessage,
  LoadingIndicator,
} from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import {
  getSeekerServiceRequests,
  SERVICE_REQUEST_STATUS_LABELS,
} from '@/services/serviceRequests';
import { getWorkersByIds } from '@/services/workerDiscovery';
import {
  ServiceRequest,
  ServiceRequestStatus,
  WorkerDiscoveryProfile,
} from '@/types';

type FilterTab = 'active' | 'completed' | 'closed';

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
 * Formats ISO timestamp string into a readable date label.
 */
const formatRequestDate = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-US', {
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

export default function SeekerRequestsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [workersMap, setWorkersMap] = useState<Record<string, WorkerDiscoveryProfile>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('active');

  const isMountedRef = useRef(true);

  const fetchRequests = useCallback(async (isPullToRefresh = false) => {
    if (!isPullToRefresh) {
      setLoading(true);
    }
    setError(null);

    try {
      const { data, error: reqError } = await getSeekerServiceRequests();

      if (!isMountedRef.current) return;

      if (reqError) {
        setError(reqError.message);
        setRequests([]);
        return;
      }

      setRequests(data);

      // Collect unique worker IDs to batch fetch public profiles
      const workerIds = Array.from(new Set(data.map((r) => r.worker_id).filter(Boolean)));
      if (workerIds.length > 0) {
        const profileMap = await getWorkersByIds(workerIds);
        if (isMountedRef.current) {
          setWorkersMap(profileMap);
        }
      }
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      const message =
        err instanceof Error ? err.message : 'Unable to load service requests.';
      setError(message);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Reload data whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true;
      fetchRequests();
      return () => {
        isMountedRef.current = false;
      };
    }, [fetchRequests])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests(true);
  }, [fetchRequests]);

  const handleMessagePress = (workerName?: string) => {
    Alert.alert(
      'In-App Messaging',
      `Direct messaging with ${workerName || 'this worker'} is currently unavailable. Chat will be enabled in an upcoming release.`,
      [{ text: 'Got it' }]
    );
  };

  const handleDetailsPress = (requestId: string) => {
    router.push({
      pathname: '/(seeker)/request-details',
      params: { requestId },
    });
  };

  // Tab counts
  const activeRequests = requests.filter(
    (req) => req.status !== 'completed' && req.status !== 'rejected' && req.status !== 'cancelled'
  );
  const completedRequests = requests.filter((req) => req.status === 'completed');
  const closedRequests = requests.filter(
    (req) => req.status === 'cancelled' || req.status === 'rejected'
  );

  const displayedRequests =
    filter === 'active'
      ? activeRequests
      : filter === 'completed'
      ? completedRequests
      : closedRequests;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Service Requests</Text>
        <Text style={styles.subtitle}>Track repair appointments in Barangay Tinago</Text>

        {/* 3-Way Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === 'active' }}
            onPress={() => setFilter('active')}
            style={[styles.tabButton, filter === 'active' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, filter === 'active' && styles.tabTextActive]}>
              Active{activeRequests.length > 0 ? ` (${activeRequests.length})` : ''}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === 'completed' }}
            onPress={() => setFilter('completed')}
            style={[styles.tabButton, filter === 'completed' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, filter === 'completed' && styles.tabTextActive]}>
              Completed{completedRequests.length > 0 ? ` (${completedRequests.length})` : ''}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === 'closed' }}
            onPress={() => setFilter('closed')}
            style={[styles.tabButton, filter === 'closed' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, filter === 'closed' && styles.tabTextActive]}>
              Closed{closedRequests.length > 0 ? ` (${closedRequests.length})` : ''}
            </Text>
          </Pressable>
        </View>

        {/* Tab Context Subtitle */}
        <Text style={styles.tabHint}>
          {filter === 'active'
            ? 'Pending, accepted, and in-progress service requests.'
            : filter === 'completed'
            ? 'Finished service jobs and repairs.'
            : 'Requests that were cancelled or declined.'}
        </Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <LoadingIndicator size="large" message="Loading your service requests..." />
        </View>
      ) : error ? (
        <View style={styles.errorWrapper}>
          <ErrorMessage
            title="Failed to Load Requests"
            message={error}
            onRetry={() => fetchRequests(false)}
            retryText="Try Again"
          />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.accent]}
              tintColor={Colors.accent}
            />
          }
        >
          {displayedRequests.length > 0 ? (
            displayedRequests.map((req) => {
              const workerInfo = workersMap[req.worker_id];
              const workerName =
                workerInfo?.full_name ||
                workerInfo?.username ||
                (req.worker ? 'Assigned Worker' : undefined);

              const isWorkerVerified =
                workerInfo?.verification_status === 'verified' ||
                req.worker?.verification_status === 'verified';

              const workerTrade = req.category?.name
                ? `${req.category.name} Specialist`
                : 'Skilled Worker';

              const formattedDate = formatRequestDate(req.created_at);

              return (
                <View key={req.id} style={styles.card}>
                  {/* Category Pill & Status Badge */}
                  <View style={styles.cardHeader}>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>
                        {req.category?.name || 'General Service'}
                      </Text>
                    </View>
                    <StatusBadge
                      label={SERVICE_REQUEST_STATUS_LABELS[req.status] || req.status}
                      status={getBadgeVariant(req.status)}
                      size="sm"
                      showDot
                    />
                  </View>

                  {/* Problem Description */}
                  <Text style={styles.issueTitle} numberOfLines={3}>
                    {req.description}
                  </Text>

                  {/* Location & Submission Date */}
                  <Text style={styles.metaLocation}>
                    <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />{' '}
                    {req.service_address}, Barangay Tinago • {formattedDate}
                  </Text>

                  {/* Preferred Schedule if specified */}
                  {req.preferred_schedule && (
                    <Text style={styles.metaSchedule}>
                      <Ionicons name="calendar-outline" size={13} color={Colors.accent} />{' '}
                      Preferred: {formatRequestDate(req.preferred_schedule)}
                    </Text>
                  )}

                  {/* Assigned Worker Row (if available) */}
                  {workerName && (
                    <View style={styles.workerRow}>
                      <Avatar
                        name={workerName}
                        size="md"
                        isVerified={isWorkerVerified}
                      />
                      <View style={styles.workerInfo}>
                        <Text style={styles.workerName}>{workerName}</Text>
                        <Text style={styles.workerTrade}>{workerTrade}</Text>
                      </View>
                      <Button
                        title="Message"
                        variant="outline"
                        size="sm"
                        onPress={() => handleMessagePress(workerName)}
                      />
                    </View>
                  )}

                  <View style={styles.cardDivider} />

                  {/* Card Actions */}
                  <View style={styles.cardActions}>
                    <Button
                      title="View Request Details"
                      variant="secondary"
                      size="sm"
                      onPress={() => handleDetailsPress(req.id)}
                      style={styles.fullAction}
                    />
                  </View>
                </View>
              );
            })
          ) : (
            <EmptyState
              title={
                filter === 'active'
                  ? 'No Active Requests'
                  : filter === 'completed'
                  ? 'No Completed Requests'
                  : 'No Closed Requests'
              }
              description={
                filter === 'active'
                  ? "You don't have any ongoing repair requests in Barangay Tinago."
                  : filter === 'completed'
                  ? 'Finished service jobs will be archived here with receipts and ratings.'
                  : 'Cancelled or declined service requests will appear here.'
              }
              iconName={
                filter === 'active'
                  ? 'receipt-outline'
                  : filter === 'completed'
                  ? 'checkmark-done-circle-outline'
                  : 'archive-outline'
              }
              actionText={filter === 'active' ? 'Find a Worker' : undefined}
              onActionPress={
                filter === 'active'
                  ? () => router.push('/(seeker)/search')
                  : undefined
              }
            />
          )}
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.sizes.display,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.full,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
  },
  tabButtonActive: {
    backgroundColor: Colors.surface,
    ...Shadows.subtle,
  },
  tabText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  tabTextActive: {
    color: Colors.textPrimary,
    fontWeight: Typography.weights.bold,
  },
  tabHint: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorWrapper: {
    padding: Spacing.lg,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.huge,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryPill: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  categoryPillText: {
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  issueTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    marginBottom: 4,
    lineHeight: 20,
  },
  metaLocation: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  metaSchedule: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.md,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  workerTrade: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textSecondary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.xs,
  },
  cardActions: {
    marginTop: Spacing.xs,
  },
  fullAction: {
    width: '100%',
  },
});
