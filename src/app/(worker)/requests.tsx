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
import { StatusBadge, Button, Avatar } from '@/components';

interface JobOrder {
  id: string;
  clientName: string;
  issue: string;
  purok: string;
  time: string;
  category: string;
  status: 'lead' | 'assigned' | 'completed';
}

const JOBS: JobOrder[] = [
  {
    id: 'job-1',
    clientName: 'Juan Dela Cruz',
    issue: 'Kitchen main PVC pipe leak and water pooling',
    purok: 'Purok 2',
    time: '15 mins ago',
    category: 'Plumbing',
    status: 'lead',
  },
  {
    id: 'job-2',
    clientName: 'Maria Santos',
    issue: 'Replace 3-gang electrical wall switch',
    purok: 'Purok 1',
    time: 'Today, 2:00 PM',
    category: 'Electrical',
    status: 'assigned',
  },
  {
    id: 'job-3',
    clientName: 'Pedro Reyes',
    issue: 'Repaired blown outdoor fuse connection',
    purok: 'Purok 3',
    time: 'Sep 24, 2026',
    category: 'Electrical',
    status: 'completed',
  },
];

export default function WorkerRequestsScreen() {
  const [activeTab, setActiveTab] = useState<'leads' | 'assigned' | 'completed'>('leads');

  const filteredJobs = JOBS.filter((job) =>
    activeTab === 'leads' ? job.status === 'lead' : activeTab === 'assigned' ? job.status === 'assigned' : job.status === 'completed'
  );

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
              New Leads
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'assigned' }}
            onPress={() => setActiveTab('assigned')}
            style={[styles.tabButton, activeTab === 'assigned' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === 'assigned' && styles.tabTextActive]}>
              Assigned
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'completed' }}
            onPress={() => setActiveTab('completed')}
            style={[styles.tabButton, activeTab === 'completed' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
              History
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {filteredJobs.map((job) => (
          <View key={job.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{job.category}</Text>
              </View>
              <StatusBadge
                label={job.status === 'lead' ? 'New Request' : job.status === 'assigned' ? 'In Progress' : 'Completed'}
                status={job.status === 'completed' ? 'success' : job.status === 'assigned' ? 'warning' : 'accent'}
                size="sm"
                showDot
              />
            </View>

            <Text style={styles.issueText}>{job.issue}</Text>

            <View style={styles.clientRow}>
              <Avatar name={job.clientName} size="sm" />
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{job.clientName}</Text>
                <Text style={styles.clientMeta}>
                  <Ionicons name="location-outline" size={12} color={Colors.textSecondary} /> {job.purok}, Tinago • {job.time}
                </Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.actionsRow}>
              {job.status === 'lead' ? (
                <>
                  <Button
                    title="Decline"
                    variant="outline"
                    size="sm"
                    onPress={() => {}}
                    style={styles.actionBtn}
                  />
                  <Button
                    title="Accept Job"
                    variant="primary"
                    size="sm"
                    onPress={() => {}}
                    style={styles.actionBtn}
                  />
                </>
              ) : job.status === 'assigned' ? (
                <>
                  <Button
                    title="Call Resident"
                    variant="outline"
                    size="sm"
                    onPress={() => {}}
                    leftIcon={<Ionicons name="call" size={14} color={Colors.textPrimary} />}
                    style={styles.actionBtn}
                  />
                  <Button
                    title="Mark Done"
                    variant="primary"
                    size="sm"
                    onPress={() => {}}
                    style={styles.actionBtn}
                  />
                </>
              ) : (
                <Button
                  title="View Completed Invoice"
                  variant="secondary"
                  size="sm"
                  onPress={() => {}}
                  style={styles.fullAction}
                />
              )}
            </View>
          </View>
        ))}
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
    marginBottom: Spacing.sm,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
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
