import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Button, TextInput, ErrorMessage, Card } from '@/components';
import { useAuth } from '@/contexts/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field validation errors
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);

  const validate = (): boolean => {
    let isValid = true;
    setEmailError(undefined);
    setPasswordError(undefined);
    setErrorMessage(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError('Email address is required.');
      isValid = false;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setErrorMessage(error.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Brand */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Ionicons name="construct" size={26} color={Colors.accent} />
              <View style={styles.cameraDot}>
                <Ionicons name="camera" size={12} color={Colors.surface} />
              </View>
            </View>
            <Text style={styles.appName}>FixMo</Text>
            <Text style={styles.tagline}>
              Camera-Driven AI Diagnostics & Service Matching
            </Text>
            <Text style={styles.communityBadge}>Barangay Tinago Network</Text>
          </View>

          {/* Form Card */}
          <Card style={styles.formCard}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSubtitle}>
              Access your service seeker or skilled worker account
            </Text>

            {errorMessage && (
              <ErrorMessage
                message={errorMessage}
                style={styles.errorBanner}
              />
            )}

            <TextInput
              label="Email Address"
              placeholder="juan.delacruz@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError(undefined);
              }}
              errorText={emailError}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              editable={!loading}
              leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />}
              required
            />

            <TextInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError(undefined);
              }}
              errorText={passwordError}
              isPassword
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              editable={!loading}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />}
              required
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
              style={styles.loginButton}
            />

            {/* Switch to Register */}
            <View style={styles.switchAuthRow}>
              <Text style={styles.switchAuthText}>Don't have an account yet?</Text>
              <Pressable
                onPress={() => router.push('/auth/register')}
                disabled={loading}
                hitSlop={8}
              >
                <Text style={styles.switchAuthLink}>Create Account</Text>
              </Pressable>
            </View>
          </Card>

          {/* Footer Information */}
          <View style={styles.footer}>
            <Text style={styles.footerNote}>
              Official platform for Barangay Tinago residents and skilled workers.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.huge,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cameraDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.accent,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  appName: {
    fontSize: Typography.sizes.display,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
    lineHeight: 18,
  },
  communityBadge: {
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.semibold,
    color: Colors.accent,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formCard: {
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xxs,
  },
  cardSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  errorBanner: {
    marginBottom: Spacing.md,
  },
  loginButton: {
    marginTop: Spacing.sm,
  },
  switchAuthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xl,
  },
  switchAuthText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  switchAuthLink: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
  },
  footer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  footerNote: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
