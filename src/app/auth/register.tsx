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
import { validateUsername } from '@/services/profile';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

  // Field validation errors
  const [usernameError, setUsernameError] = useState<string | undefined>(undefined);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | undefined>(undefined);

  const validate = (): boolean => {
    let isValid = true;
    setUsernameError(undefined);
    setEmailError(undefined);
    setPasswordError(undefined);
    setConfirmPasswordError(undefined);
    setErrorMessage(null);

    // 1. Username validation
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      setUsernameError(usernameValidation.error);
      isValid = false;
    }

    // 2. Email validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email address is required.');
      isValid = false;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    // 3. Password validation
    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      isValid = false;
    }

    // 4. Confirm password validation
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrorMessage(null);
    setConfirmationNotice(null);

    try {
      const { error, requiresEmailConfirmation } = await signUp(
        email,
        password,
        username
      );

      if (error) {
        setErrorMessage(error.message);
      } else if (requiresEmailConfirmation) {
        setConfirmationNotice(
          'Account created! Please check your email to confirm your account before logging in.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to register account. Please try again.');
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
            <Text style={styles.tagline}>Join Barangay Tinago Service Network</Text>
          </View>

          {/* Form Card */}
          <Card style={styles.formCard}>
            <Text style={styles.cardTitle}>Create Account</Text>
            <Text style={styles.cardSubtitle}>
              Register with your unique username and email to request services or offer skilled trades
            </Text>

            {errorMessage && (
              <ErrorMessage
                message={errorMessage}
                style={styles.errorBanner}
              />
            )}

            {confirmationNotice && (
              <View style={styles.noticeBox}>
                <Ionicons name="mail-unread-outline" size={22} color={Colors.success} />
                <View style={styles.noticeTextColumn}>
                  <Text style={styles.noticeTitle}>Verification Sent</Text>
                  <Text style={styles.noticeDesc}>{confirmationNotice}</Text>
                </View>
              </View>
            )}

            <TextInput
              label="Username"
              placeholder="e.g. juandelacruz"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (usernameError) setUsernameError(undefined);
              }}
              errorText={usernameError}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              leftIcon={<Ionicons name="at-outline" size={18} color={Colors.textSecondary} />}
              helperText="3-20 characters (letters, numbers, and underscores)"
              required
            />

            <TextInput
              label="Email Address"
              placeholder="name@example.com"
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
              placeholder="At least 6 characters"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError(undefined);
              }}
              errorText={passwordError}
              isPassword
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              editable={!loading}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />}
              helperText="Minimum 6 characters"
              required
            />

            <TextInput
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmPasswordError) setConfirmPasswordError(undefined);
              }}
              errorText={confirmPasswordError}
              isPassword
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              editable={!loading}
              leftIcon={<Ionicons name="checkmark-done-outline" size={18} color={Colors.textSecondary} />}
              required
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              fullWidth
              size="lg"
              style={styles.registerButton}
            />

            {/* Switch to Login */}
            <View style={styles.switchAuthRow}>
              <Text style={styles.switchAuthText}>Already have an account?</Text>
              <Pressable
                onPress={() => router.push('/auth/login')}
                disabled={loading}
                hitSlop={8}
              >
                <Text style={styles.switchAuthLink}>Sign In</Text>
              </Pressable>
            </View>
          </Card>

          {/* Footer Information */}
          <View style={styles.footer}>
            <Text style={styles.footerNote}>
              By registering, you agree to follow the Barangay Tinago community standards.
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
    marginBottom: Spacing.lg,
  },
  logoBadge: {
    width: 58,
    height: 58,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
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
    width: 20,
    height: 20,
    borderRadius: 10,
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
    marginTop: 2,
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
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  noticeTextColumn: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.successDark,
    marginBottom: 2,
  },
  noticeDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.successDark,
    lineHeight: 18,
  },
  registerButton: {
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
