import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';
import {
  testSupabaseConnection,
  isSupabaseConfigured,
  ConnectionTestResult,
} from '@/services/supabase';

export const SupabaseConnectionCard: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectionTestResult | null>(null);

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    try {
      const res = await testSupabaseConnection();
      setResult(res);
    } catch (err: any) {
      setResult({
        success: false,
        message: err?.message || 'Unexpected connection error',
      });
    } finally {
      setTesting(false);
    }
  };

  const configured = isSupabaseConfigured();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="server-outline" size={20} color={Colors.accent} />
          <Text style={styles.cardTitle}>Supabase Backend</Text>
        </View>

        <StatusBadge
          label={
            result
              ? result.success
                ? 'Online'
                : 'Failed'
              : configured
              ? 'Configured'
              : 'Keys Needed'
          }
          status={
            result
              ? result.success
                ? 'success'
                : 'error'
              : configured
              ? 'accent'
              : 'warning'
          }
          size="sm"
          showDot
        />
      </View>

      <Text style={styles.cardDescription}>
        FixMo uses Supabase for database, authentication, and real-time community requests.
      </Text>

      {result && (
        <View
          style={[
            styles.resultBox,
            result.success ? styles.resultSuccess : styles.resultError,
          ]}
        >
          <Ionicons
            name={result.success ? 'checkmark-circle' : 'alert-circle'}
            size={18}
            color={result.success ? Colors.success : Colors.error}
          />
          <View style={styles.resultTextColumn}>
            <Text
              style={[
                styles.resultMessage,
                result.success ? styles.resultMessageSuccess : styles.resultMessageError,
              ]}
            >
              {result.message}
            </Text>
            {result.latencyMs !== undefined && (
              <Text style={styles.latencyText}>Response time: {result.latencyMs}ms</Text>
            )}
          </View>
        </View>
      )}

      {!result && !configured && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.warningDark} />
          <Text style={styles.infoText}>
            Add your Supabase project URL and Anon Key to `.env.local` to connect.
          </Text>
        </View>
      )}

      <View style={styles.actionContainer}>
        <Button
          title={testing ? 'Testing Connection...' : 'Test Supabase Connection'}
          onPress={runTest}
          loading={testing}
          variant="outline"
          size="sm"
          fullWidth
          leftIcon={<Ionicons name="refresh" size={16} color={Colors.textPrimary} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  cardDescription: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  infoText: {
    fontSize: Typography.sizes.xxs,
    color: Colors.warningDark,
    flex: 1,
    lineHeight: 16,
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  resultSuccess: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.successBorder,
  },
  resultError: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.errorBorder,
  },
  resultTextColumn: {
    flex: 1,
  },
  resultMessage: {
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
  },
  resultMessageSuccess: {
    color: Colors.successDark,
    fontWeight: Typography.weights.medium,
  },
  resultMessageError: {
    color: Colors.errorDark,
  },
  latencyText: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  actionContainer: {
    marginTop: Spacing.xxs,
  },
});
