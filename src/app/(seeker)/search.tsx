import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import {
  Avatar,
  StatusBadge,
  Card,
  TextInput,
  Button,
  LoadingIndicator,
  EmptyState,
  ErrorMessage,
} from '@/components';
import {
  getVerifiedWorkers,
  getServiceCategories,
  getCategoryIconName,
  filterVerifiedWorkers,
} from '@/services';
import {
  WorkerDiscoveryProfile,
  ServiceCategory,
} from '@/types';

export default function SeekerSearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('All');

  // Supabase Data State
  const [workers, setWorkers] = useState<WorkerDiscoveryProfile[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load verified workers & categories
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [workersRes, categoriesRes] = await Promise.all([
        getVerifiedWorkers(),
        getServiceCategories(),
      ]);

      if (workersRes.error) {
        setError(workersRes.error.message);
      } else {
        setWorkers(workersRes.data);
      }

      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to load worker directory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fast, responsive client-side filtering without refetch flicker
  const filteredWorkers = useMemo(() => {
    return filterVerifiedWorkers(workers, {
      searchQuery,
      categoryId: selectedCategoryId,
    });
  }, [workers, searchQuery, selectedCategoryId]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      {/* Top Header & Search Area */}
      <View style={styles.header}>
        <Text style={styles.title}>Find a Worker</Text>
        <Text style={styles.subtitle}>Verified community workers in Barangay Tinago</Text>

        {/* Search input */}
        <TextInput
          placeholder="Search by worker name, skill, bio, or area..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          leftIcon={<Ionicons name="search" size={20} color={Colors.textSecondary} />}
          rightIcon={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search text"
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ opacity: searchQuery.length > 0 ? 1 : 0 }}
              pointerEvents={searchQuery.length > 0 ? 'auto' : 'none'}
            >
              <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
            </Pressable>
          }
          containerStyle={styles.searchContainer}
        />

        {/* Dynamic Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.filtersScroll}
        >
          {/* "All" Option */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter by all categories"
            onPress={() => setSelectedCategoryId('All')}
            style={[
              styles.filterChip,
              selectedCategoryId === 'All' && styles.filterChipActive,
            ]}
          >
            <Ionicons
              name="grid-outline"
              size={14}
              color={selectedCategoryId === 'All' ? Colors.textInverse : Colors.textSecondary}
            />
            <Text
              style={[
                styles.filterChipText,
                selectedCategoryId === 'All' && styles.filterChipTextActive,
              ]}
            >
              All Categories
            </Text>
          </Pressable>

          {/* Dynamic Categories from Supabase */}
          {categories.map((category) => {
            const isActive = selectedCategoryId === category.id;
            const iconName = getCategoryIconName(category.icon, category.name);

            return (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${category.name}`}
                onPress={() => setSelectedCategoryId(category.id)}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={14}
                  color={isActive ? Colors.textInverse : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.contentContainer}
      >
        {/* Loading State */}
        {loading && (
          <View style={styles.stateWrapper}>
            <LoadingIndicator size="small" message="Discovering verified workers in Tinago..." />
          </View>
        )}

        {/* Error State */}
        {!loading && error && (
          <View style={styles.stateWrapper}>
            <ErrorMessage
              message={error}
              onRetry={loadData}
              retryText="Try Again"
            />
          </View>
        )}

        {/* Initial Empty State (No verified workers exist in DB) */}
        {!loading && !error && workers.length === 0 && (
          <View style={styles.stateWrapper}>
            <EmptyState
              iconName="shield-checkmark-outline"
              title="No Verified Workers Yet"
              description="Skilled workers undergo verification by Barangay Tinago officials before appearing here. Check back soon!"
              actionText="Refresh Directory"
              onActionPress={loadData}
            />
          </View>
        )}

        {/* Filter/Search Empty State (Workers exist, but filter matched none) */}
        {!loading && !error && workers.length > 0 && filteredWorkers.length === 0 && (
          <View style={styles.stateWrapper}>
            <EmptyState
              iconName="search-outline"
              title="No Matching Workers Found"
              description="No verified workers matched your selected category or search keyword in Barangay Tinago."
              actionText="Reset Filters"
              onActionPress={() => {
                setSearchQuery('');
                setSelectedCategoryId('All');
              }}
            />
          </View>
        )}

        {/* Verified Workers List */}
        {!loading && !error && filteredWorkers.length > 0 && (
          <>
            <View style={styles.resultsCountRow}>
              <Text style={styles.resultsCount}>
                Verified Workers in Tinago ({filteredWorkers.length})
              </Text>
              {selectedCategoryId !== 'All' && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear category filter"
                  onPress={() => setSelectedCategoryId('All')}
                >
                  <Text style={styles.clearFilterText}>Show All</Text>
                </Pressable>
              )}
            </View>

            {filteredWorkers.map((worker) => {
              const displayName = worker.full_name || worker.username;
              const isAvailable = worker.availability_status === 'available';

              return (
                <Card key={worker.worker_id} variant="outlined" style={styles.workerCard}>
                  {/* Top Row: Avatar & Profile Info */}
                  <View style={styles.cardTopRow}>
                    <Avatar
                      name={displayName}
                      size="lg"
                      isVerified={worker.verification_status === 'verified'}
                    />

                    <View style={styles.workerInfo}>
                      <View style={styles.nameStatusRow}>
                        <View style={styles.nameGroup}>
                          <Text style={styles.workerName} numberOfLines={1}>
                            {displayName}
                          </Text>
                          <Text style={styles.workerHandle}>@{worker.username}</Text>
                        </View>

                        {/* Availability Status Badge */}
                        <StatusBadge
                          label={isAvailable ? 'Available' : 'Unavailable'}
                          status={isAvailable ? 'success' : 'neutral'}
                          size="sm"
                          showDot
                        />
                      </View>

                      {/* Verification Status Badge */}
                      <View style={styles.verificationBadgeRow}>
                        <StatusBadge
                          label="Verified Worker"
                          status="success"
                          size="sm"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Worker Bio (if provided) */}
                  {worker.bio ? (
                    <Text style={styles.bioText} numberOfLines={3}>
                      {worker.bio}
                    </Text>
                  ) : null}

                  {/* Offered Services / Categories */}
                  {worker.services && worker.services.length > 0 ? (
                    <View style={styles.servicesRow}>
                      {worker.services.map((ws) => (
                        <View key={ws.id} style={styles.servicePill}>
                          <Ionicons
                            name={getCategoryIconName(ws.category?.icon, ws.category?.name)}
                            size={12}
                            color={Colors.accent}
                          />
                          <Text style={styles.servicePillText}>
                            {ws.category?.name || 'Service'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {/* Divider */}
                  <View style={styles.cardDivider} />

                  {/* Metadata Row: Experience & Service Area */}
                  <View style={styles.metaRow}>
                    {worker.experience_years !== null && worker.experience_years !== undefined ? (
                      <View style={styles.metaItem}>
                        <Ionicons name="ribbon-outline" size={14} color={Colors.textSecondary} />
                        <Text style={styles.metaText}>
                          {worker.experience_years} {worker.experience_years === 1 ? 'yr' : 'yrs'} experience
                        </Text>
                      </View>
                    ) : null}

                    {worker.service_area ? (
                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {worker.service_area}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Request Action Button */}
                  <View style={styles.cardActionRow}>
                    <Button
                      title={isAvailable ? 'Request Service' : 'Worker Unavailable'}
                      variant={isAvailable ? 'primary' : 'outline'}
                      size="sm"
                      disabled={!isAvailable}
                      onPress={() => {
                        router.push({
                          pathname: '/(seeker)/request',
                          params: {
                            workerId: worker.worker_id,
                            categoryId:
                              selectedCategoryId !== 'All' &&
                              worker.services?.some((s) => s.category_id === selectedCategoryId)
                                ? selectedCategoryId
                                : undefined,
                          },
                        });
                      }}
                    />
                  </View>
                </Card>
              );
            })}
          </>
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
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.sizes.xl,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
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
  contentContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.huge,
  },
  stateWrapper: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  resultsCount: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.semibold,
  },
  clearFilterText: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent,
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
    alignItems: 'flex-start',
  },
  nameGroup: {
    flex: 1,
    paddingRight: Spacing.xs,
  },
  workerName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  workerHandle: {
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.medium,
    color: Colors.accent,
    marginTop: 1,
  },
  verificationBadgeRow: {
    marginTop: 6,
    flexDirection: 'row',
  },
  bioText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  servicePillText: {
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  cardActionRow: {
    marginTop: Spacing.md,
  },
});
