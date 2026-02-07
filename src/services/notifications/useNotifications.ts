import { useEffect, useRef, useCallback, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Subscription } from 'expo-notifications';
import { useRouter } from 'expo-router';
import { AppState, AppStateStatus } from 'react-native';
import { notificationService, NotificationType } from './notificationService';
import { useAuthStore } from '../../stores/authStore';

export function useNotifications() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  const notificationListener = useRef<Subscription | null>(null);
  const responseListener = useRef<Subscription | null>(null);

  // Handle notification received while app is foregrounded
  const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
    const data = notification.request.content.data;
    console.log('Notification received:', data);

    // You can show an in-app notification here if needed
  }, []);

  // Handle notification tap
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    const type = data.type as NotificationType;

    console.log('Notification tapped:', type, data);

    // Navigate based on notification type
    switch (type) {
      case 'new_match':
        if (data.matchId) {
          router.push(`/(tabs)/matches/chat/${data.matchId}`);
        } else {
          router.push('/(tabs)/matches');
        }
        break;

      case 'new_message':
        if (data.matchId) {
          router.push(`/(tabs)/matches/chat/${data.matchId}`);
        }
        break;

      case 'new_like':
      case 'profile_like_comment':
        router.push('/(tabs)/likes');
        break;

      case 'match_expiring':
        if (data.matchId) {
          router.push(`/(tabs)/matches/chat/${data.matchId}`);
        }
        break;

      default:
        // Default to home
        router.push('/(tabs)/discover');
    }
  }, [router]);

  // Register for push notifications
  const registerForNotifications = useCallback(async () => {
    // Setup Android channels first
    await notificationService.setupAndroidChannel();

    // Get permission and token
    const token = await notificationService.registerForPushNotifications();

    if (token) {
      setExpoPushToken(token);
      await notificationService.savePushToken(token);
    }

    // Update permission status
    const status = await notificationService.getPermissionStatus();
    setPermissionStatus(status);

    return token;
  }, []);

  // Check permission status
  const checkPermissions = useCallback(async () => {
    const status = await notificationService.getPermissionStatus();
    setPermissionStatus(status);
    return status;
  }, []);

  // Initialize notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    // Setup listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    // Register for notifications
    registerForNotifications();

    // Cleanup
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, handleNotificationReceived, handleNotificationResponse, registerForNotifications]);

  // Clear badge when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        notificationService.setBadgeCount(0);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  return {
    permissionStatus,
    expoPushToken,
    registerForNotifications,
    checkPermissions,
    isNotificationsEnabled: permissionStatus === 'granted',
  };
}

/**
 * Hook to request notification permissions with a prompt
 */
export function useNotificationPermission() {
  const [status, setStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const checkStatus = useCallback(async () => {
    const currentStatus = await notificationService.getPermissionStatus();
    setStatus(currentStatus);
    return currentStatus;
  }, []);

  const requestPermission = useCallback(async () => {
    setIsRequesting(true);
    try {
      const token = await notificationService.registerForPushNotifications();
      const newStatus = await notificationService.getPermissionStatus();
      setStatus(newStatus);

      if (token) {
        await notificationService.savePushToken(token);
      }

      return newStatus === 'granted';
    } finally {
      setIsRequesting(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    status,
    isRequesting,
    isGranted: status === 'granted',
    isDenied: status === 'denied',
    isUndetermined: status === 'undetermined',
    checkStatus,
    requestPermission,
  };
}
