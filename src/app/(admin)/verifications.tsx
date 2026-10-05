import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import {
  Header,
  Avatar,
  StatusBadge,
  LoadingIndicator,
  EmptyState,
  ErrorMessage,
  Card,
  Button,
} from '@/components';
import {
  checkIsAdmin,
  getPendingWorkers,
  adminUpdateWorkerVerification,
} from '@/services/admin';
import { PendingWorkerItem } from '@/types';

export default function AdminVerificationsScreen() {
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [migrationMissing, setMigrationMissing] = useState<boolean>(false);

  const [workers, setWorkers] = useState<PendingWorkerItem[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Tracks which worker row is currently being processed
  const [processingWorkerId, setProcessingWorkerId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  /**
   * 1. Validates server-side administrator authorization via is_admin() RPC.
   */
  const verifyAdminAccess = useCallback(async () => {
    setCheckingAuth(true);
    setAuthError(null);
    setMigrationMissing(false);

    try {
      const { isAdmin: authorized, error } = await checkIsAdmin();

      if (error) {
        const errorMsg = error.message.toLowerCase();
        // Check if database function is missing (migration not applied yet)
        if (
          errorMsg.includes('does not exist') ||
          errorMsg.includes('pgrst202') ||
          errorMsg.includes('is_admin')
        ) {
          setMigrationMissing(true);
          setAuthError(
            'The database migration has not been applied yet. The is_admin() function was not found.'
          );
        } else {
          setAuthError(error.message);
        }
        setIsAdmin(false);
        setCheckingAuth(false);
        return;
      }

      setIsAdmin(authorized);
      if (!authorized) {
        setAuthError('Access restricted: Only designated administrators can view this portal.');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to authenticate administrator permissions.');
      setIsAdmin(false);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  /**
   * 2. Fetches all pending worker profiles.
   */
  const loadPendingWorkers = useCallback(async () => {
    setLoadingWorkers(true);
    setFetchError(null);
    setActionSuccessMessage(null);

    try {
      const { data, error } = await getPendingWorkers();

      if (error) {
        setFetchError(error.message);
        setWorkers([]);
      } else {
        setWorkers(data || []);
      }
    } catch (err: any) {
      setFetchError(err?.message || 'Failed to retrieve pending worker verifications.');
      setWorkers([]);
    } finally {
      setLoadingWorkers(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    verifyAdminAccess();
  }, [verifyAdminAccess]);

  useEffect(() => {
    if (isAdmin) {
      loadPendingWorkers();
    }
  }, [isAdmin, loadPendingWorkers]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    if (!isAdmin) {
      verifyAdminAccess();
    } else {
      loadPendingWorkers();
    }
  }, [isAdmin, verifyAdminAccess, loadPendingWorkers]);

  /**
   * 3. Executes the admin verification update via the server-side RPC.
   */
  const handleVerificationDecision = (
    worker: PendingWorkerItem,
    decision: 'verified' | 'rejected'
  ) => {
    const workerName =
      worker.profile?.full_name || `@${worker.profile?.username || 'Worker'}`;
    const actionLabel = decision === 'verified' ? 'Approve' : 'Reject';

    Alert.alert(
      `${actionLabel} Worker Verification`,
      `Are you sure you want to ${actionLabel.toLowerCase()} ${workerName}'s verification request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabel,
          style: decision === 'rejected' ? 'destructive' : 'default',
          onPress: async () => {
            setProcessingWorkerId(worker.id);
            setActionSuccessMessage(null);
            setFetchError(null);

            try {
              const { data, error } = await adminUpdateWorkerVerification(
                worker.id,
                decision
              );

              if (error) {
                Alert.alert(
                  'Verification Failed',
                  error.message || 'An error occurred while updating status.'
                );
              } else if (data) {
                // Remove worker from the pending list
                setWorkers((prev) => prev.filter((w) => w.id !== worker.id));
                const msg = `Successfully ${
                  decision === 'verified' ? 'verified' : 'rejected'
                } ${workerName}.`;
                setActionSuccessMessage(msg);
              }
            } catch (err: any) {
              Alert.alert('Unexpected Error', err?.message || 'Failed to update status.');
            } finally {
              setProcessingWorkerId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  };

  // --- STATE 1: CHECKING AUTHENTICATION ---
  if (checkingAuth) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
        <Header
          title="Admin Verification Portal"
          subtitle="Verifying credentials..."
          onBack={() => router.back()}
        />
        <View style={styles.centerContainer}>
          <LoadingIndicator size="large" message="Verifying database administrator privileges..." />
        </View>
      </SafeAreaView>
    );
  }

  // --- STATE 2: MIGRATION REQUIRED BANNER ---
  if (migrationMissing) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
        <Header
          title="Admin Verification Portal"
          onBack={() => router.back()}
        />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.alertBanner}>
            <Ionicons name="warning" size={32} color={Colors.warningDark} />
            <Text style={styles.alertTitle}>Database Migration Required</Text>
            <Text style={styles.alertDescription}>
              The Phase 1 database migration has not been applied to Supabase yet. The
              administrative functions (is_admin, admin_update_worker_verification) and
              protection triggers must be installed in the Supabase SQL Editor.
            </Text>
            <View style={styles.codeSnippetBox}>
              <Text style={styles.codeSnippetText}>
                Execute supabase/migrations/20261004120000_worker_verification_and_admin_approval.sql
              </Text>
            </View>
            <Button
              title="Check Again"
              variant="primary"
              onPress={verifyAdminAccess}
              style={styles.alertButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- STATE 3: UNAUTHORIZED / NON-ADMIN ---
  if (!isAdmin) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
        <Header
          title="Admin Verification Portal"
          onBack={() => router.back()}
        />
        <View style={styles.centerContainer}>
          <Ionicons name="shield-outline" size={64} color={Colors.textTertiary} />
          <Text style={styles.unauthTitle}>Access Denied</Text>
          <Text style={styles.unauthMessage}>
            {authError ||
              'Only authorized FixMo administrators can access this portal and manage worker verifications.'}
          </Text>
          <Button
            title="Return to Home"
            variant="outline"
            onPress={() => router.back()}
            style={styles.unauthButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // --- STATE 4: AUTHORIZED ADMIN DASHBOARD ---
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <Header
        title="Worker Approvals"
        subtitle="Review and verify skilled worker credentials"
        onBack={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.accent}
          />
        }
      >
        {/* Success Banner */}
        {actionSuccessMessage ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.successDark} />
            <Text style={styles.successText}>{actionSuccessMessage}</Text>
            <TouchableOpacity onPress={() => setActionSuccessMessage(null)}>
              <Ionicons name="close" size={16} color={Colors.successDark} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Error Banner */}
        {fetchError ? (
          <ErrorMessage
            message={fetchError}
            onRetry={loadPendingWorkers}
            style={styles.errorContainer}
          />
        ) : null}

        {/* Summary Card */}
        <Card variant="flat" style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>{workers.length}</Text>
              <Text style={styles.statsLabel}>Pending Review</Text>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsItem}>
              <View style={styles.badgeRow}>
                <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
                <Text style={styles.adminStatusText}>Admin Active</Text>
              </View>
              <Text style={styles.statsLabel}>Role Verified</Text>
            </View>
          </View>
        </Card>

        {/* Section Heading */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Verification Queue</Text>
          <TouchableOpacity onPress={loadPendingWorkers} disabled={loadingWorkers}>
            {loadingWorkers ? (
              <ActivityIndicator size="small" color={Colors.accent} />
            ) : (
              <Ionicons name="refresh" size={18} color={Colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loadingWorkers && !refreshing && workers.length === 0 ? (
          <View style={styles.loadingBox}>
            <LoadingIndicator size="large" message="Loading pending applications..." />
          </View>
        ) : null}

        {/* Empty State */}
        {!loadingWorkers && workers.length === 0 && !fetchError ? (
          <EmptyState
            iconName="checkmark-done-circle-outline"
            title="Verification Queue Clear"
            description="There are no pending worker verification requests at this time. All skilled worker applications have been processed."
            actionText="Refresh Queue"
            onActionPress={loadPendingWorkers}
            style={styles.emptyStateContainer}
          />
        ) : null}

        {/* Worker Cards List */}
        {workers.map((worker) => {
          const isProcessing = processingWorkerId === worker.id;
          const displayName =
            worker.profile?.full_name || `@${worker.profile?.username || 'Worker'}`;
          const username = worker.profile?.username ? `@${worker.profile.username}` : '';

          return (
            <Card key={worker.id} variant="elevated" style={styles.workerCard}>
              {/* Header: Avatar, Name, Handle, and Status */}
              <View style={styles.workerHeader}>
                <Avatar
                  name={displayName}
                  source={
                    worker.profile?.avatar_url
                      ? { uri: worker.profile.avatar_url }
                      : undefined
                  }
                  size="lg"
                />
                <View style={styles.workerMainInfo}>
                  <Text style={styles.workerName}>{displayName}</Text>
                  {username ? <Text style={styles.workerHandle}>{username}</Text> : null}
                  <View style={styles.badgeWrapper}>
                    <StatusBadge label="Pending Review" status="warning" size="sm" showDot />
                  </View>
                </View>
              </View>

              {/* Details: Experience, Location, Applied Date */}
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Ionicons name="briefcase-outline" size={15} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>
                    Experience: {worker.experience_years ?? 0}{' '}
                    {worker.experience_years === 1 ? 'year' : 'years'}
                  </Text>
                </View>

                {worker.service_area ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={15} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>Area: {worker.service_area}</Text>
                  </View>
                ) : null}

                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={15} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>Submitted: {formatDate(worker.created_at)}</Text>
                </View>
              </View>

              {/* Bio Section */}
              {worker.bio ? (
                <View style={styles.bioContainer}>
                  <Text style={styles.bioLabel}>Worker Bio & Description</Text>
                  <Text style={styles.bioText} numberOfLines={4}>
                    {worker.bio}
                  </Text>
                </View>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <Button
                  title="Reject"
                  variant="outline"
                  size="md"
                  disabled={isProcessing}
                  onPress={() => handleVerificationDecision(worker, 'rejected')}
                  style={[styles.actionBtn, styles.rejectBtn]}
                />
                <Button
                  title={isProcessing ? 'Processing...' : 'Approve Worker'}
                  variant="primary"
                  size="md"
                  loading={isProcessing}
                  disabled={isProcessing}
                  onPress={() => handleVerificationDecision(worker, 'verified')}
                  style={[styles.actionBtn, styles.approveBtn]}
                />
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unauthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  unauthMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  unauthButton: {
    minWidth: 160,
  },
  alertBanner: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warningBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.warningDark,
    marginTop: 10,
    marginBottom: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  codeSnippetBox: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 16,
  },
  codeSnippetText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.textPrimary,
  },
  alertButton: {
    minWidth: 160,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    borderColor: Colors.successBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: Colors.successDark,
    fontWeight: '500',
  },
  errorContainer: {
    marginBottom: 16,
  },
  statsCard: {
    marginBottom: 20,
    paddingVertical: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statsItem: {
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statsLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adminStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  loadingBox: {
    paddingVertical: 40,
  },
  emptyStateContainer: {
    marginTop: 20,
  },
  workerCard: {
    marginBottom: 16,
    padding: 16,
  },
  workerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workerMainInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  workerHandle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  badgeWrapper: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  detailsContainer: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  bioContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  bioLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bioText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  actionBtn: {
    flex: 1,
  },
  rejectBtn: {
    borderColor: Colors.errorBorder,
  },
  approveBtn: {
    backgroundColor: Colors.accent,
  },
});
