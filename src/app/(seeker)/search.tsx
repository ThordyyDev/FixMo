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
import { Avatar, StatusBadge, Button, TextInput } from '@/components';

interface WorkerItem {
  id: string;
  name: string;
  trade: string;
  purok: string;
  rating: number;
  completedJobs: number;
  isAvailable: boolean;
  isVerified: boolean;
}

const SAMPLE_WORKERS: WorkerItem[] = [
  {
    id: '1',
    name: 'Reynaldo Cruz',
    trade: 'Master Electrician',
    purok: 'Purok 2',
    rating: 4.9,
    completedJobs: 42,
    isAvailable: true,
    isVerified: true,
  },
  {
    id: '2',
    name: 'Danilo Orais',
    trade: 'Pipe & Water Plumber',
    purok: 'Purok 1',
    rating: 4.8,
    completedJobs: 36,
    isAvailable: true,
    isVerified: true,
  },
  {
    id: '3',
    name: 'Arnold Llises',
    trade: 'Furniture & House Carpenter',
    purok: 'Purok 3',
    rating: 4.7,
    completedJobs: 29,
    isAvailable: false,
    isVerified: true,
  },
  {
    id: '4',
    name: 'Joel Baldon',
    trade: 'Appliance & AC Technician',
    purok: 'Purok 4',
    rating: 4.9,
    completedJobs: 51,
    isAvailable: true,
    isVerified: true,
  },
];

export default function SeekerSearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filters = ['All', 'Electrical', 'Plumbing', 'Carpentry', 'Appliances'];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Skilled Workers</Text>
        <Text style={styles.subtitle}>Verified community workers in Barangay Tinago</Text>

        {/* Search input */}
        <TextInput
          placeholder="Search by skill or worker name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search" size={20} color={Colors.textSecondary} />}
          containerStyle={styles.searchContainer}
        />

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {filters.map((filter) => {
            const isActive = selectedFilter === filter;
            return (
              <Pressable
                key={filter}
                accessibilityRole="button"
                onPress={() => setSelectedFilter(filter)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.workersList}
      >
        <Text style={styles.resultsCount}>
          Available in Tinago ({SAMPLE_WORKERS.length} workers)
        </Text>

        {SAMPLE_WORKERS.map((worker) => (
          <View key={worker.id} style={styles.workerCard}>
            <View style={styles.cardTopRow}>
              <Avatar name={worker.name} size="lg" isVerified={worker.isVerified} />

              <View style={styles.workerInfo}>
                <View style={styles.nameStatusRow}>
                  <Text style={styles.workerName}>{worker.name}</Text>
                  <StatusBadge
                    label={worker.isAvailable ? 'Available' : 'Busy'}
                    status={worker.isAvailable ? 'success' : 'neutral'}
                    size="sm"
                    showDot
                  />
                </View>

                <Text style={styles.workerTrade}>{worker.trade}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={styles.ratingText}>{worker.rating}</Text>
                  </View>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>{worker.completedJobs} jobs</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{worker.purok}</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.cardActionsRow}>
              <Button
                title="View Profile"
                variant="secondary"
                size="sm"
                onPress={() => {}}
                style={styles.actionBtn}
              />
              <Button
                title="Request Worker"
                variant="primary"
                size="sm"
                onPress={() => {}}
                disabled={!worker.isAvailable}
                style={styles.actionBtn}
              />
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
    marginBottom: Spacing.sm,
  },
  searchContainer: {
    marginBottom: Spacing.sm,
  },
  filtersScroll: {
    gap: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterChipText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  filterChipTextActive: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.bold,
  },
  workersList: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.huge,
  },
  resultsCount: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.semibold,
  },
  workerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  workerInfo: {
    flex: 1,
  },
  nameStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workerName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  workerTrade: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  metaDot: {
    color: Colors.textTertiary,
    fontSize: 10,
  },
  metaText: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textSecondary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.sm,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});
