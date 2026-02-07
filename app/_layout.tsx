import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../src/components/ui/Toast';
import { RealtimeProvider } from '../src/providers';
import { ErrorBoundary, NetworkStatus } from '../src/components/error';
import { useScreenTracking } from '../src/services/analytics';
import { analyticsService } from '../src/services/analytics';
import { colors } from '../src/theme/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function AppContent() {
  // Track screen views automatically
  useScreenTracking();

  // Track app open
  useEffect(() => {
    analyticsService.track('app_open');
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <NetworkStatus />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

function handleError(error: Error, errorInfo: React.ErrorInfo) {
  // Log to analytics
  analyticsService.trackError(error, 'ErrorBoundary');

  // In production, you would send this to a crash reporting service
  // Example: Sentry.captureException(error, { extra: errorInfo });
  console.error('App Error:', error, errorInfo);
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary onError={handleError}>
            <RealtimeProvider>
              <ToastProvider>
                <AppContent />
              </ToastProvider>
            </RealtimeProvider>
          </ErrorBoundary>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
