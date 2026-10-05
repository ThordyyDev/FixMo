import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { RoleProvider, useRole } from '@/contexts/RoleContext';
import { LoadingIndicator } from '@/components';
import { Colors } from '@/constants/theme';

function NavigationGuard() {
  const { user, loading } = useAuth();
  const { role } = useRole();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // User is not authenticated -> redirect to login
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // User is authenticated and on auth screen -> redirect to active role
      router.replace(role === 'worker' ? '/(worker)' : '/(seeker)');
    }
  }, [user, loading, segments, role]);

  if (loading) {
    return (
      <View style={styles.splashContainer}>
        <LoadingIndicator
          size="large"
          message="Loading FixMo..."
        />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(seeker)" options={{ headerShown: false }} />
      <Stack.Screen name="(worker)" options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      <Stack.Screen
        name="design-system"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <RoleProvider>
          <NavigationGuard />
        </RoleProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
