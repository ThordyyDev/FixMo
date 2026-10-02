import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { Avatar, StatusBadge, Button, EmptyState } from '@/components';

interface ServiceRequest {
  id: string;
  category: string;
  issueTitle: string;
  purok: string;
  date: string;
  status: 'pending' | 'matched' | 'completed' | 'cancelled';
  statusLabel: string;
  workerName?: string;
  workerTrade?: string;
}

const REQUESTS: ServiceRequest[] = [
  {
    id: 'req-1',
    category: 'Plumbing',
    issueTitle: 'Kitchen sink PVC pipe leak under counter',
    purok: 'Purok 2',
    date: 'Today, 10:15 AM',
    status: 'matched',
    statusLabel: 'Worker Assigned',
    workerName: 'Danilo Orais',
    workerTrade: 'Master Plumber',
  },
  {
    id: 'req-2',
    category: 'Electrical',
    issueTitle: 'Main circuit breaker trips when heater is turned on',
    purok: 'Purok 1',
    date: 'Sep 25, 2026',
    status: 'completed',
    statusLabel: 'Completed',
    workerName: 'Reynaldo Cruz',
    workerTrade: 'Electrician',
  },
];

export default function SeekerRequestsScreen() {
  const [filter, setFilter] = useState<'active' | 'completed'>('active');

  const filteredRequests = REQUESTS.filter((req) =>
    filter === 'active' ? req.status === 'matched' || req.status === 'pending' : req.status === 'completed'
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Service Requests</Text>
        <Text style={styles.subtitle}>Track AI diagnostics & repair appointments</Text>

        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === 'active' }}
            onPress={() => setFilter('active')}
            style={[styles.tabButton, filter === 'active' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, filter === 'active' && styles.tabTextActive]}>
              Active
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === 'completed' }}
            onPress={() => setFilter('completed')}
            style={[styles.tabButton, filter === 'completed' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, filter === 'completed' && styles.tabTextActive]}>
              Completed
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {filteredRequests.length > 0 ? (
          filteredRequests.map((req) => (
            <View key={req.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{req.category}</Text>
                </View>
                <StatusBadge
                  label={req.statusLabel}
                  status={req.status === 'completed' ? 'success' : 'accent'}
                  size="sm"
                  showDot
                />
              </View>

              <Text style={styles.issueTitle}>{req.issueTitle}</Text>
              <Text style={styles.metaLocation}>
                <Ionicons name="location-outline" size={13} color={Colors.textSecondary} /> {req.purok}, Barangay Tinago • {req.date}
              </Text>

              {req.workerName && (
                <View style={styles.workerRow}>
                  <Avatar name={req.workerName} size="md" isVerified />
                  <View style={styles.workerInfo}>
                    <Text style={styles.workerName}>{req.workerName}</Text>
                    <Text style={styles.workerTrade}>{req.workerTrade}</Text>
                  </View>
                  <Button
                    title="Message"
                    variant="outline"
                    size="sm"
                    onPress={() => {}}
                  />
                </View>
              )}

              <View style={styles.cardDivider} />

              <View style={styles.cardActions}>
                <Button
                  title="View Diagnostic Details"
                  variant="secondary"
                  size="sm"
                  onPress={() => {}}
                  style={styles.fullAction}
                />
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            title="No Completed Requests"
            description="Finished service jobs will be archived here with ratings and receipts."
            iconName="receipt-outline"
          />
        )}
      </ScrollView>
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
    fontSize: Typography.sizes.sm,
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
  },
  metaLocation: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
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
