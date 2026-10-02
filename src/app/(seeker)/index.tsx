import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRole } from '@/contexts/RoleContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { StatusBadge } from '@/components';

interface ServiceCategoryItem {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  isAiDiagnostic?: boolean;
}

const CATEGORIES: ServiceCategoryItem[] = [
  { id: 'ai-diag', name: 'AI Scan', icon: 'camera', isAiDiagnostic: true },
  { id: 'electrical', name: 'Electrical', icon: 'flash' },
  { id: 'plumbing', name: 'Plumbing', icon: 'water' },
  { id: 'carpentry', name: 'Carpentry', icon: 'hammer' },
  { id: 'appliances', name: 'Appliances', icon: 'tv' },
  { id: 'masonry', name: 'Masonry', icon: 'construct' },
];

export default function SeekerHomeScreen() {
  const router = useRouter();
  const { switchToWorker } = useRole();
  const [selectedCategory, setSelectedCategory] = useState<string>('ai-diag');

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTopRow}>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={16} color={Colors.surface} />
              <Text style={styles.locationText}>Barangay Tinago, Cebu</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Switch to skilled worker mode"
              onPress={switchToWorker}
              style={({ pressed }) => [
                styles.workerModePill,
                pressed && styles.workerModePillPressed,
              ]}
            >
              <Ionicons name="construct" size={13} color={Colors.accent} />
              <Text style={styles.workerModePillText}>Worker Mode</Text>
            </Pressable>
          </View>

          <View style={styles.heroContentRow}>
            <View style={styles.heroTextColumn}>
              <Text style={styles.heroGreeting}>FixMo Service Seeker</Text>
              <Text style={styles.heroTitle}>Need a repair in Tinago?</Text>
              <Text style={styles.heroSubtitle}>
                Snap a photo with AI diagnostics or match directly with certified barangay workers.
              </Text>
            </View>

            <View style={styles.heroIconCircle}>
              <Ionicons name="camera" size={28} color={Colors.surface} />
            </View>
          </View>
        </View>

        {/* Search Bar (Navigates to Search Tab) */}
        <View style={styles.searchCardContainer}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(seeker)/search')}
            style={({ pressed }) => [
              styles.searchCard,
              pressed && styles.searchCardPressed,
            ]}
          >
            <View style={styles.searchIconCircle}>
              <Ionicons name="search" size={20} color={Colors.accent} />
            </View>
            <View style={styles.searchPlaceholderBox}>
              <Text style={styles.searchPlaceholderTitle}>Find a skilled worker...</Text>
              <Text style={styles.searchPlaceholderSubtitle}>Electricians, plumbers, carpenters in Tinago</Text>
            </View>
            <View style={styles.aiTagPill}>
              <Ionicons name="scan" size={14} color={Colors.accent} />
              <Text style={styles.aiTagPillText}>AI Ready</Text>
            </View>
          </Pressable>
        </View>

        {/* Service Categories Grid */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionHeading}>Service Categories</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  accessibilityRole="button"
                  onPress={() => setSelectedCategory(cat.id)}
                  style={styles.categoryItem}
                >
                  <View
                    style={[
                      styles.circularIconContainer,
                      cat.isAiDiagnostic && styles.circularIconAi,
                      isSelected && styles.circularIconSelected,
                    ]}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={22}
                      color={
                        cat.isAiDiagnostic
                          ? Colors.accent
                          : isSelected
                          ? Colors.accent
                          : Colors.textPrimary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryLabel,
                      isSelected && styles.categoryLabelSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Recent Locations & Quick Requests */}
        <View style={styles.placesSection}>
          <Text style={styles.sectionHeading}>Frequent Barangay Locations</Text>

          <Pressable style={styles.placeRow}>
            <View style={styles.placeIconBox}>
              <Ionicons name="home" size={18} color={Colors.textPrimary} />
            </View>
            <View style={styles.placeInfo}>
              <Text style={styles.placeTitle}>Home Address (Purok 2)</Text>
              <Text style={styles.placeSubtitle}>Near Tinago Elementary School</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </Pressable>

          <View style={styles.placeDivider} />

          <Pressable style={styles.placeRow}>
            <View style={styles.placeIconBox}>
              <Ionicons name="business" size={18} color={Colors.textPrimary} />
            </View>
            <View style={styles.placeInfo}>
              <Text style={styles.placeTitle}>Barangay Tinago Hall</Text>
              <Text style={styles.placeSubtitle}>Barangay Officials & Community Desk</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </Pressable>
        </View>

        {/* Community Updates */}
        <View style={styles.highlightsSection}>
          <Text style={styles.sectionHeading}>Tinago Community Notices</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalCardsScroll}
          >
            <View style={styles.highlightCard}>
              <StatusBadge label="Community Safety" status="success" size="sm" />
              <Text style={styles.highlightCardTitle}>28 Verified Local Workers</Text>
              <Text style={styles.highlightCardDesc}>
                All workers undergo Barangay safety check and skills validation before listing.
              </Text>
            </View>

            <View style={styles.highlightCard}>
              <StatusBadge label="AI Diagnostic Tip" status="accent" size="sm" />
              <Text style={styles.highlightCardTitle}>Take Clear Repair Photos</Text>
              <Text style={styles.highlightCardDesc}>
                Ensure adequate lighting and take photo within 1 meter of the damage.
              </Text>
            </View>
          </ScrollView>
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
    backgroundColor: '#1E293B',
    paddingTop: 54,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 48,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  locationText: {
    color: Colors.surface,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  workerModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  workerModePillPressed: {
    opacity: 0.85,
  },
  workerModePillText: {
    color: Colors.accent,
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.bold,
  },
  heroContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTextColumn: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  heroGreeting: {
    color: '#94A3B8',
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  heroTitle: {
    color: Colors.surface,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginBottom: 4,
  },
  heroSubtitle: {
    color: '#94A3B8',
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
  },
  heroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchCardContainer: {
    marginTop: -28,
    paddingHorizontal: Spacing.lg,
  },
  searchCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchCardPressed: {
    backgroundColor: Colors.surfaceSecondary,
  },
  searchIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  searchPlaceholderBox: {
    flex: 1,
  },
  searchPlaceholderTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  searchPlaceholderSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  aiTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  aiTagPillText: {
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
  },
  categoriesSection: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeading: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryItem: {
    alignItems: 'center',
    width: 48,
  },
  circularIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
    ...Shadows.subtle,
  },
  circularIconAi: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accentBorder,
  },
  circularIconSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  categoryLabel: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: Colors.accent,
    fontWeight: Typography.weights.bold,
  },
  placesSection: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.subtle,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  placeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  placeInfo: {
    flex: 1,
  },
  placeTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  placeSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  placeDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.xs,
  },
  highlightsSection: {
    marginTop: Spacing.xl,
  },
  horizontalCardsScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  highlightCard: {
    width: 250,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.subtle,
  },
  highlightCardTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  highlightCardDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
