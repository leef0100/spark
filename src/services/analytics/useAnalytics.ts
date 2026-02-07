import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { analyticsService, AnalyticsEvent, AnalyticsProperties } from './analyticsService';
import { useAuthStore } from '../../stores/authStore';

/**
 * Hook for tracking analytics events
 */
export function useAnalytics() {
  const user = useAuthStore((state) => state.user);

  // Set user when authenticated
  useEffect(() => {
    analyticsService.setUser(user?.id ?? null);
  }, [user?.id]);

  const track = useCallback(
    (event: AnalyticsEvent, properties?: AnalyticsProperties) => {
      analyticsService.track(event, properties);
    },
    []
  );

  const trackScreen = useCallback(
    (screenName: string, properties?: AnalyticsProperties) => {
      analyticsService.trackScreen(screenName, properties);
    },
    []
  );

  const trackError = useCallback((error: Error, context?: string) => {
    analyticsService.trackError(error, context);
  }, []);

  return {
    track,
    trackScreen,
    trackError,
  };
}

/**
 * Hook for automatic screen tracking
 */
export function useScreenTracking() {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    if (pathname !== previousPathname.current) {
      analyticsService.trackScreen(pathname);
      previousPathname.current = pathname;
    }
  }, [pathname]);
}

/**
 * Hook for tracking timing/performance
 */
export function usePerformanceTracking(category: string, name: string) {
  const startTime = useRef<number | null>(null);

  const start = useCallback(() => {
    startTime.current = Date.now();
  }, []);

  const end = useCallback(() => {
    if (startTime.current !== null) {
      const duration = Date.now() - startTime.current;
      analyticsService.trackTiming(category, name, duration);
      startTime.current = null;
      return duration;
    }
    return 0;
  }, [category, name]);

  return { start, end };
}
