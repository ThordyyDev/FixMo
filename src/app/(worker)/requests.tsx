import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import {
  StatusBadge,
  BadgeStatus,
  Button,
  Avatar,
  LoadingIndicator,
  ErrorMessage,
  EmptyState,
} from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import {
  getWorkerServiceRequests,
  SERVICE_REQUEST_STATUS_LABELS,
} from '@/services/serviceRequests';
import { ServiceRequest, ServiceRequestStatus } from '@/types';

type TabType = 'leads' | 'assigned' | 'completed';

/**
 * Maps database service request status to StatusBadge visual variant.
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
 * Formats ISO date string into human-readable label.
 */
const formatRequestDate = (isoString?: string | null): string => {
  if (!isoString) return '';
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

export default function WorkerRequestsScreen() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('leads');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);

  const fetchRequests = useCallback(
    async (isPullToRefresh = false) => {
      if (!isPullToRefresh) {
        setLoading(true);
      }
      setError(null);

      try {
        const { data, error: fetchErr } = await getWorkerServiceRequests(user?.id);

        if (!isMountedRef.current) return;

        if (fetchErr) {
          setError(fetchErr.message);
          setRequests([]);
          return;
        }

        setRequests(data);
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        const message =
          err instanceof Error ? err.message : 'Unable to load assigned requests.';
        setError(message);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [user?.id]
  );

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

  // Tab categorization
  const leads = requests.filter((req) => req.status === 'pending');
  const assigned = requests.filter(
    (req) =>
      req.status === 'accepted' ||
      req.status === 'on_the_way' ||
      req.status === 'arrived' ||
      req.status === 'in_service'
  );
  const history = requests.filter(
    (req) =>
      req.status === 'completed' ||
      req.status === 'cancelled' ||
      req.status === 'rejected'
  );

  const displayedRequests =
    activeTab === 'leads' ? leads : activeTab === 'assigned' ? assigned : history;

  // Informative notice for actions scheduled for the next lifecycle milestone
  const handleActionPending = (actionName: string) => {
    Alert.alert(
      'Action Notice',
      `${actionName} functionality will be enabled in the upcoming job lifecycle update. No status change was applied.`,
      [{ text: 'OK' }]
    );
  };

  const handleCallResident = (phone?: string | null, residentName?: string) => {
    if (!phone) {
      Alert.alert(
        'Phone Number Unavailable',
        `A contact phone number is not available for ${residentName || 'this resident'}. Contact permissions or seeker profile details may be pending.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Call Failed', `Unable to initiate call to ${phone}.`);
    });
  };

  const handleViewDetails = (req: ServiceRequest) => {
    Alert.alert(
      'Job Order Summary',
      `ID: ${req.id.slice(0, 8)}...\nStatus: ${SERVICE_REQUEST_STATUS_LABELS[req.status] || req.status}\nCategory: ${req.category?.name || 'General'}\nAddress: ${req.service_address}\nDescription: ${req.description}`,
      [{ text: 'Close' }]
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Job Orders & Leads</Text>
        <Text style={styles.subtitle}>Requests from Barangay Tinago residents</Text>

        <View style={styles.tabSwitcher}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'leads' }}
            onPress={() => setActiveTab('leads')}
            style={[styles.tabButton, activeTab === 'leads' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === 'leads' && styles.tabTextActive]}>
              New Leads{leads.length > 0 ? ` (${leads.length})` : ''}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'assigned' }}
            onPress={() => setActiveTab('assigned')}
            style={[styles.tabButton, activeTab === 'assigned' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === 'assigned' && styles.tabTextActive]}>
              Assigned{assigned.length > 0 ? ` (${assigned.length})` : ''}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'completed' }}
            onPress={() => setActiveTab('completed')}
            style={[styles.tabButton, activeTab === 'completed' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
              History{history.length > 0 ? ` (${history.length})` : ''}
            </Text>
          </Pressable>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <LoadingIndicator size="large" message="Loading job orders & leads..." />
        </View>
      ) : error ? (
        <View style={styles.errorWrapper}>
          <ErrorMessage
            title="Failed to Load Job Orders"
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
            displayedRequests.map((job) => {
              const clientName =
                job.seeker?.full_name || job.seeker?.username || 'Resident';
              const categoryName = job.category?.name || 'General Service';
              const formattedDate = formatRequestDate(job.created_at);
              const formattedSchedule = formatRequestDate(job.preferred_schedule);

              return (
                <View key={job.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{categoryName}</Text>
                    </View>
                    <StatusBadge
                      label={SERVICE_REQUEST_STATUS_LABELS[job.status] || job.status}
                      status={getBadgeVariant(job.status)}
                      size="sm"
                      showDot
                    />
                  </View>

                  <Text style={styles.issueText}>{job.description}</Text>

                  {formattedSchedule ? (
                    <Text style={styles.scheduleText}>
                      <Ionicons name="calendar-outline" size={12} color={Colors.accent} />{' '}
                      Preferred Schedule: {formattedSchedule}
                    </Text>
                  ) : null}

                  <View style={styles.clientRow}>
                    <Avatar name={clientName} size="sm" />
                    <View style={styles.clientInfo}>
                      <Text style={styles.clientName}>{clientName}</Text>
                      <Text style={styles.clientMeta}>
                        <Ionicons
                          name="location-outline"
                          size={12}
                          color={Colors.textSecondary}
                        />{' '}
                        {job.service_address}, Tinago • {formattedDate}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.actionsRow}>
                    {activeTab === 'leads' ? (
                      <>
                        <Button
                          title="Decline"
                          variant="outline"
                          size="sm"
                          onPress={() => handleActionPending('Decline Job')}
                          style={styles.actionBtn}
                        />
                        <Button
                          title="Accept Job"
                          variant="primary"
                          size="sm"
                          onPress={() => handleActionPending('Accept Job')}
                          style={styles.actionBtn}
                        />
                      </>
                    ) : activeTab === 'assigned' ? (
                      <>
                        <Button
                          title="Call Resident"
                          variant="outline"
                          size="sm"
                          onPress={() =>
                            handleCallResident(job.seeker?.phone, clientName)
                          }
                          leftIcon={
                            <Ionicons
                              name="call"
                              size={14}
                              color={Colors.textPrimary}
                            />
                          }
                          style={styles.actionBtn}
                        />
                        <Button
                          title="Update Status"
                          variant="primary"
                          size="sm"
                          onPress={() => handleActionPending('Status Update')}
                          style={styles.actionBtn}
                        />
                      </>
                    ) : (
                      <Button
                        title="View Details"
                        variant="secondary"
                        size="sm"
                        onPress={() => handleViewDetails(job)}
                        style={styles.fullAction}
                      />
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyWrapper}>
              <EmptyState
                title={
                  activeTab === 'leads'
                    ? 'No New Leads'
                    : activeTab === 'assigned'
                    ? 'No Assigned Jobs'
                    : 'No Job History'
                }
                description={
                  activeTab === 'leads'
                    ? 'New incoming service requests from Barangay Tinago residents will appear here.'
                    : activeTab === 'assigned'
                    ? 'Jobs you accept and are actively servicing will appear here.'
                    : 'Closed, cancelled, or completed service requests will appear here.'
                }
                iconName={
                  activeTab === 'leads'
                    ? 'mail-unread-outline'
                    : activeTab === 'assigned'
                    ? 'construct-outline'
                    : 'time-outline'
                }
                actionText="Refresh"
                onActionPress={() => fetchRequests(false)}
              />
            </View>
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
    paddingBottom: Spacing.md,
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
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.huge,
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
  emptyWrapper: {
    paddingTop: Spacing.xl,
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
  issueText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  scheduleText: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.sm,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.xxs,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  clientMeta: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
  fullAction: {
    width: '100%',
  },
});
