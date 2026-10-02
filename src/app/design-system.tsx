import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Header,
  Button,
  SecondaryButton,
  TextInput,
  Card,
  StatusBadge,
  Avatar,
  ServiceCategoryCard,
  LoadingIndicator,
  EmptyState,
  ErrorMessage,
} from '@/components';
import { Colors, Spacing, Typography } from '@/constants/theme';

export default function DesignSystemDemoScreen() {
  const router = useRouter();
  // Demo states for interactive components
  const [inputText, setInputText] = useState('');
  const [passwordText, setPasswordText] = useState('');
  const [hasInputError, setHasInputError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('electrical');
  const [buttonLoading, setButtonLoading] = useState(false);
  const [showErrorBanner, setShowErrorBanner] = useState(true);

  const toggleLoading = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 2000);
  };

  return (
    <ScreenContainer scrollable padding={false}>
      {/* Header */}
      <Header
        title="FixMo Design System"
        subtitle="Barangay Tinago Foundation"
        showBorder
        rightAction={
          <StatusBadge label="v1.0" status="accent" size="sm" />
        }
      />

      <View style={styles.body}>
        {/* Intro Banner */}
        <Card variant="flat" padding="md" style={styles.introCard}>
          <Text style={styles.introTitle}>FixMo UI Foundation</Text>
          <Text style={styles.introDescription}>
            Professional, modern, and neutral design system inspired by on-demand service platforms. Test all interactive tokens and components below.
          </Text>
        </Card>

        {/* Section: Service Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Service Category Cards</Text>
          <Text style={styles.sectionSubtitle}>Tap to test selection state</Text>
          <View style={styles.categoryGrid}>
            <View style={styles.gridItem}>
              <ServiceCategoryCard
                title="Electrical"
                subtitle="14 Workers"
                iconName="flash-outline"
                badgeText="Popular"
                isSelected={selectedCategory === 'electrical'}
                onPress={() => setSelectedCategory('electrical')}
              />
            </View>
            <View style={styles.gridItem}>
              <ServiceCategoryCard
                title="Plumbing"
                subtitle="8 Workers"
                iconName="water-outline"
                isSelected={selectedCategory === 'plumbing'}
                onPress={() => setSelectedCategory('plumbing')}
              />
            </View>
            <View style={styles.gridItem}>
              <ServiceCategoryCard
                title="Carpentry"
                subtitle="11 Workers"
                iconName="hammer-outline"
                isSelected={selectedCategory === 'carpentry'}
                onPress={() => setSelectedCategory('carpentry')}
              />
            </View>
            <View style={styles.gridItem}>
              <ServiceCategoryCard
                title="Appliances"
                subtitle="6 Workers"
                iconName="construct-outline"
                badgeText="AI Ready"
                isSelected={selectedCategory === 'appliances'}
                onPress={() => setSelectedCategory('appliances')}
              />
            </View>
          </View>
        </View>

        {/* Section: Status Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Status Badges</Text>
          <Text style={styles.sectionSubtitle}>Verification and job lifecycle states</Text>
          <View style={styles.badgeRow}>
            <StatusBadge label="Verified Worker" status="success" showDot />
            <StatusBadge label="In Progress" status="warning" showDot />
            <StatusBadge label="Cancelled" status="error" showDot />
            <StatusBadge label="Active Match" status="accent" />
            <StatusBadge label="Tinago Resident" status="neutral" />
          </View>
        </View>

        {/* Section: Avatars */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Avatars & Verification</Text>
          <Text style={styles.sectionSubtitle}>Worker profiles and resident representations</Text>
          <View style={styles.avatarRow}>
            <View style={styles.avatarItem}>
              <Avatar name="Juan Dela Cruz" size="xl" isVerified />
              <Text style={styles.avatarLabel}>XL Verified</Text>
            </View>
            <View style={styles.avatarItem}>
              <Avatar name="Maria Santos" size="lg" isVerified />
              <Text style={styles.avatarLabel}>Large</Text>
            </View>
            <View style={styles.avatarItem}>
              <Avatar name="Pedro Reyes" size="md" />
              <Text style={styles.avatarLabel}>Medium</Text>
            </View>
            <View style={styles.avatarItem}>
              <Avatar name="Ana Lim" size="sm" />
              <Text style={styles.avatarLabel}>Small</Text>
            </View>
          </View>
        </View>

        {/* Section: Text Inputs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Text Inputs</Text>
          <Text style={styles.sectionSubtitle}>Standard, secure password, and validation states</Text>
          <Card variant="default" padding="lg">
            <TextInput
              label="Service Description or Issue"
              placeholder="e.g., Leaking kitchen pipe under the sink"
              value={inputText}
              onChangeText={setInputText}
              leftIcon={<Ionicons name="search-outline" size={20} color={Colors.textSecondary} />}
              helperText="Describe the repair needed in Barangay Tinago"
              required
            />

            <TextInput
              label="Account Password"
              placeholder="Enter secure password"
              value={passwordText}
              onChangeText={setPasswordText}
              isPassword
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />}
            />

            <TextInput
              label="Phone Number"
              placeholder="0917-000-0000"
              value={hasInputError ? 'Invalid phone' : '09171234567'}
              errorText={hasInputError ? 'Please enter a valid 11-digit Philippine mobile number' : undefined}
              leftIcon={<Ionicons name="call-outline" size={20} color={Colors.textSecondary} />}
              rightIcon={
                <Button
                  title={hasInputError ? 'Clear' : 'Trigger Error'}
                  variant="ghost"
                  size="sm"
                  onPress={() => setHasInputError(!hasInputError)}
                />
              }
            />
          </Card>
        </View>

        {/* Section: Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Buttons</Text>
          <Text style={styles.sectionSubtitle}>Primary, secondary, outline, and loading states</Text>
          <View style={styles.buttonStack}>
            <Button
              title="Primary Action (Request Worker)"
              onPress={toggleLoading}
              loading={buttonLoading}
              fullWidth
              leftIcon={<Ionicons name="camera-outline" size={20} color={Colors.textInverse} />}
            />

            <SecondaryButton
              title="Secondary Action (Browse History)"
              onPress={() => {}}
              fullWidth
              leftIcon={<Ionicons name="time-outline" size={20} color={Colors.textPrimary} />}
            />

            <Button
              title="Outline Action (View Tinago Map)"
              variant="outline"
              onPress={() => {}}
              fullWidth
              leftIcon={<Ionicons name="location-outline" size={20} color={Colors.textPrimary} />}
            />

            <View style={styles.buttonInlineRow}>
              <View style={styles.flexOne}>
                <Button
                  title="Danger"
                  variant="danger"
                  size="md"
                  onPress={() => {}}
                  fullWidth
                />
              </View>
              <View style={styles.flexOne}>
                <Button
                  title="Disabled"
                  variant="primary"
                  size="md"
                  disabled
                  onPress={() => {}}
                  fullWidth
                />
              </View>
            </View>
          </View>
        </View>

        {/* Section: Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Cards & Elevation</Text>
          <Text style={styles.sectionSubtitle}>Default outlined, elevated, and clickable</Text>
          <Card variant="elevated" padding="lg" style={styles.sampleCard}>
            <View style={styles.cardHeader}>
              <Avatar name="Reynaldo Cruz" size="md" isVerified />
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Reynaldo Cruz</Text>
                <Text style={styles.cardSubtitle}>Master Electrician • Purok 2, Tinago</Text>
              </View>
              <StatusBadge label="Available" status="success" size="sm" showDot />
            </View>
            <View style={styles.cardDivider} />
            <Text style={styles.cardBody}>
              12 years experience repairing electrical panels, home wiring, and circuit breakers. Certified Barangay worker.
            </Text>
          </Card>
        </View>

        {/* Section: Feedback & States */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Feedback & Messages</Text>
          <Text style={styles.sectionSubtitle}>Errors, loading, and empty states</Text>

          {showErrorBanner && (
            <ErrorMessage
              title="Camera Permission Required"
              message="FixMo needs access to your camera to perform AI image diagnostic scans."
              retryText="Grant Permission"
              onRetry={() => setShowErrorBanner(false)}
              style={styles.messageBox}
            />
          )}

          <Card variant="default" padding="md" style={styles.messageBox}>
            <Text style={styles.cardSubtitle}>Inline Loading State:</Text>
            <LoadingIndicator message="Analyzing captured image with AI..." />
          </Card>

          <EmptyState
            title="No Active Requests"
            description="You currently have no service requests in progress. Scan an issue with your camera to begin."
            iconName="construct-outline"
            actionText="Start Diagnosis"
            onActionPress={() => {}}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  introCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  introTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  introDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  gridItem: {
    width: '47.5%',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  avatarLabel: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  buttonStack: {
    gap: Spacing.sm,
  },
  buttonInlineRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  flexOne: {
    flex: 1,
  },
  sampleCard: {
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },
  cardBody: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  messageBox: {
    marginBottom: Spacing.md,
  },
});
