import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>Spark</Text>
        <ActivityIndicator size="large" color={colors.rose} style={styles.loader} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/discover" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    ...typography.h1,
    color: colors.rose,
    fontSize: 48,
  },
  loader: {
    marginTop: 24,
  },
});
