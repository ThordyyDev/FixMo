import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { View, StyleSheet } from 'react-native';
import { LoadingIndicator } from '@/components';
import { Colors } from '@/constants/theme';

export default function RootIndex() {
  const { user, loading } = useAuth();
  const { role } = useRole();

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  return <Redirect href={role === 'worker' ? '/(worker)' : '/(seeker)'} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
