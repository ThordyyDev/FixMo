import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRole } from '@/contexts/RoleContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { StatusBadge, Button, Avatar } from '@/components';

export default function WorkerDashboardScreen() {
  const { switchToSeeker } = useRole();
  const [isAvailable, setIsAvailable] = useState(true);

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Worker Hero Header */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTopRow}>
            <View style={styles.statusIndicatorRow}>
              <View
                style={[
                  styles.statusLightDot,
                  isAvailable ? styles.statusLightOnline : styles.statusLightOffline,
                ]}
              />
              <Text style={styles.statusText}>
                {isAvailable ? 'Online • Accepting Tinago Jobs' : 'Offline • Busy'}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Switch to seeker mode"
              onPress={switchToSeeker}
              style={({ pressed }) => [
                styles.roleSwitchPill,
                pressed && styles.roleSwitchPillPressed,
              ]}
            >
              <Ionicons name="person" size={13} color={Colors.accent} />
              <Text style={styles.roleSwitchPillText}>Seeker Mode</Text>
            </Pressable>
          </View>

          <View style={styles.workerProfileRow}>
            <Avatar name="Reynaldo Cruz" size="lg" isVerified />
            <View style={styles.workerProfileText}>
              <Text style={styles.workerRoleTag}>Certified Skilled Worker</Text>
              <Text style={styles.workerName}>Reynaldo Cruz</Text>
              <Text style={styles.workerTrade}>Master Electrician • Purok 2, Tinago</Text>
            </View>
          </View>

          {/* Online/Offline Toggle Button */}
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: isAvailable }}
            onPress={() => setIsAvailable(!isAvailable)}
            style={[
              styles.availabilityToggleBar,
              isAvailable ? styles.availabilityOnline : styles.availabilityOffline,
            ]}
          >
            <View style={styles.toggleLeft}>
              <Ionicons
                name={isAvailable ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={isAvailable ? Colors.success : Colors.textSecondary}
              />
              <Text style={styles.toggleTitle}>
                {isAvailable ? 'You are Available for Dispatch' : 'You are currently Offline'}
              </Text>
            </View>
            <Text style={styles.toggleActionText}>
              {isAvailable ? 'Go Offline' : 'Go Online'}
            </Text>
          </Pressable>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>42</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.statValue}>4.9</Text>
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.accent }]}>2</Text>
            <Text style={styles.statLabel}>Active Leads</Text>
          </View>
        </View>

        {/* Incoming Job Opportunity Card */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Incoming Job Requests</Text>
            <StatusBadge label="1 New" status="accent" size="sm" />
          </View>

          <View style={styles.incomingJobCard}>
            <View style={styles.jobBadgeRow}>
              <StatusBadge label="AI Diagnostic Match" status="accent" size="sm" showDot />
              <Text style={styles.jobDistanceText}>350m away</Text>
            </View>

            <Text style={styles.jobTitle}>Emergency: Circuit Breaker Overheating</Text>
            <Text style={styles.jobLocation}>
              <Ionicons name="location-outline" size={13} color={Colors.textSecondary} /> Purok 2, Tinago (Near Chapel)
            </Text>
            <Text style={styles.jobNotes}>
              Seeker notes: "Breaker started sparking when the aircon was plugged in. Main breaker turned off."
            </Text>

            <View style={styles.jobDivider} />

            <View style={styles.jobActionButtons}>
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
            </View>
          </View>
        </View>

        {/* Today's Schedule */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Scheduled Repairs Today</Text>

          <View style={styles.scheduleCard}>
            <View style={styles.scheduleTimeBox}>
              <Text style={styles.scheduleTimeHour}>2:00</Text>
              <Text style={styles.scheduleTimePeriod}>PM</Text>
            </View>
            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleClient}>Client: Maria Santos</Text>
              <Text style={styles.scheduleJob}>Replace 3 Gang Switch Box</Text>
              <Text style={styles.scheduleAddress}>Purok 1, Tinago</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.huge,
  },
  heroBanner: {
    backgroundColor: '#0F172A',
    paddingTop: 54,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusLightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLightOnline: {
    backgroundColor: Colors.success,
  },
  statusLightOffline: {
    backgroundColor: Colors.error,
  },
  statusText: {
    color: '#CBD5E1',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  roleSwitchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  roleSwitchPillPressed: {
    opacity: 0.85,
  },
  roleSwitchPillText: {
    color: Colors.accent,
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.bold,
  },
  workerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  workerProfileText: {
    flex: 1,
  },
  workerRoleTag: {
    color: '#94A3B8',
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workerName: {
    color: Colors.surface,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginTop: 2,
  },
  workerTrade: {
    color: '#CBD5E1',
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  availabilityToggleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  availabilityOnline: {
    borderColor: 'rgba(18, 183, 106, 0.4)',
  },
  availabilityOffline: {
    borderColor: 'rgba(240, 68, 56, 0.3)',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  toggleTitle: {
    color: Colors.surface,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  toggleActionText: {
    color: Colors.surface,
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.bold,
    textDecorationLine: 'underline',
  },
  statsSection: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginTop: -16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionContainer: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  incomingJobCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.accentBorder,
    ...Shadows.card,
  },
  jobBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  jobDistanceText: {
    fontSize: Typography.sizes.xxs,
    color: Colors.accent,
    fontWeight: Typography.weights.bold,
  },
  jobTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  jobLocation: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginVertical: 4,
  },
  jobNotes: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.xs,
    lineHeight: 18,
  },
  jobDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.sm,
  },
  jobActionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  scheduleTimeBox: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  scheduleTimeHour: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  scheduleTimePeriod: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.semibold,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleClient: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  scheduleJob: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  scheduleAddress: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});
