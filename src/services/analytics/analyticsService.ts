import { Platform } from 'react-native';

// Analytics event types
export type AnalyticsEvent =
  | 'app_open'
  | 'sign_up_started'
  | 'sign_up_completed'
  | 'profile_completed'
  | 'profile_viewed'
  | 'profile_liked'
  | 'profile_passed'
  | 'comment_sent'
  | 'match_created'
  | 'match_expired'
  | 'message_sent'
  | 'message_received'
  | 'chat_opened'
  | 'photo_uploaded'
  | 'prompt_added'
  | 'preferences_updated'
  | 'notification_permission_requested'
  | 'notification_permission_granted'
  | 'notification_permission_denied'
  | 'notification_tapped'
  | 'error_occurred'
  | 'screen_view';

export interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined;
}

export interface UserProperties {
  userId?: string;
  age?: number;
  gender?: string;
  city?: string;
  profileComplete?: boolean;
  matchCount?: number;
  photoCount?: number;
}

class AnalyticsService {
  private isEnabled: boolean = true;
  private userId: string | null = null;
  private sessionId: string;
  private sessionStart: Date;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStart = new Date();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Enable or disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Set the current user for analytics
   */
  setUser(userId: string | null): void {
    this.userId = userId;

    if (__DEV__) {
      console.log('[Analytics] User set:', userId);
    }
  }

  /**
   * Set user properties for segmentation
   */
  setUserProperties(properties: UserProperties): void {
    if (!this.isEnabled) return;

    if (__DEV__) {
      console.log('[Analytics] User properties:', properties);
    }

    // In production, send to your analytics provider
    // Example: Firebase Analytics, Mixpanel, Amplitude, etc.
  }

  /**
   * Track an event
   */
  track(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
    if (!this.isEnabled) return;

    const eventData = {
      event,
      properties: {
        ...properties,
        platform: Platform.OS,
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
      },
      user_id: this.userId,
    };

    if (__DEV__) {
      console.log('[Analytics] Event:', eventData);
    }

    // In production, send to your analytics provider
    // Example implementations:
    // - Firebase: analytics().logEvent(event, properties)
    // - Mixpanel: mixpanel.track(event, properties)
    // - Amplitude: amplitude.logEvent(event, properties)
  }

  /**
   * Track screen views
   */
  trackScreen(screenName: string, properties?: AnalyticsProperties): void {
    this.track('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  /**
   * Track errors
   */
  trackError(error: Error, context?: string): void {
    this.track('error_occurred', {
      error_message: error.message,
      error_name: error.name,
      context,
    });
  }

  /**
   * Track timing (for performance monitoring)
   */
  trackTiming(category: string, name: string, durationMs: number): void {
    if (__DEV__) {
      console.log(`[Analytics] Timing: ${category}/${name} = ${durationMs}ms`);
    }
  }

  /**
   * Get session duration
   */
  getSessionDuration(): number {
    return Date.now() - this.sessionStart.getTime();
  }

  /**
   * Reset session (call when app comes to foreground after long background)
   */
  resetSession(): void {
    this.sessionId = this.generateSessionId();
    this.sessionStart = new Date();
  }
}

export const analyticsService = new AnalyticsService();
