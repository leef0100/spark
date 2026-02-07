import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type NotificationType =
  | 'new_match'
  | 'new_message'
  | 'new_like'
  | 'match_expiring'
  | 'profile_like_comment';

export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export const notificationService = {
  /**
   * Register for push notifications and get token
   */
  async registerForPushNotifications(): Promise<string | null> {
    // Only works on physical devices
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Get the Expo push token
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      return tokenData.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  },

  /**
   * Save push token to database
   */
  async savePushToken(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,token' });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to save push token' };
    }
  },

  /**
   * Remove push token from database
   */
  async removePushToken(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('token', token);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to remove push token' };
    }
  },

  /**
   * Get current notification permissions status
   */
  async getPermissionStatus(): Promise<Notifications.PermissionStatus> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  },

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    notification: NotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: { type: notification.type, ...notification.data },
        sound: true,
      },
      trigger: trigger || null, // null = immediate
    });
  },

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return Notifications.getBadgeCountAsync();
  },

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  },

  /**
   * Clear all delivered notifications
   */
  async dismissAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  },

  /**
   * Setup Android notification channel
   */
  async setupAndroidChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B6B',
      });

      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        description: 'New message notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B6B',
      });

      await Notifications.setNotificationChannelAsync('matches', {
        name: 'Matches',
        description: 'New match notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#FF6B6B',
      });

      await Notifications.setNotificationChannelAsync('likes', {
        name: 'Likes',
        description: 'New like notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#FF6B6B',
      });
    }
  },
};
