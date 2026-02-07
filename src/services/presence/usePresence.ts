import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { presenceService } from './presenceService';
import { useAuthStore } from '../../stores/authStore';

/**
 * Hook to manage the current user's presence
 */
export function usePresence() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Initialize presence
    presenceService.initialize(user.id);

    // Handle app state changes
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        presenceService.setOnline();
      } else if (nextState === 'background' || nextState === 'inactive') {
        presenceService.setAway();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      presenceService.cleanup();
    };
  }, [isAuthenticated, user]);
}

/**
 * Hook to get another user's presence status
 */
export function useUserPresence(userId: string | null) {
  const [status, setStatus] = useState<'online' | 'away' | 'offline'>('offline');
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPresence = useCallback(async () => {
    if (!userId) {
      setStatus('offline');
      setLastSeen(null);
      setIsLoading(false);
      return;
    }

    try {
      const presence = await presenceService.getUserPresence(userId);
      setStatus(presence.status);
      setLastSeen(presence.lastSeen);
    } catch (error) {
      console.error('Error fetching presence:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPresence();

    // Refresh presence every 30 seconds
    const interval = setInterval(fetchPresence, 30000);
    return () => clearInterval(interval);
  }, [fetchPresence]);

  return {
    status,
    lastSeen,
    isLoading,
    isOnline: status === 'online',
    isAway: status === 'away',
    refresh: fetchPresence,
  };
}

/**
 * Hook for typing indicators in a chat
 */
export function useTypingIndicator(matchId: string) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastTypingSent = useRef<number>(0);

  // Subscribe to typing events
  useEffect(() => {
    if (!matchId) return;

    const handleTypingChange = (userId: string, isTyping: boolean) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);

        if (isTyping) {
          next.add(userId);

          // Clear existing timeout
          const existingTimeout = typingTimeouts.current.get(userId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          // Auto-clear typing after 3 seconds
          const timeout = setTimeout(() => {
            setTypingUsers((current) => {
              const updated = new Set(current);
              updated.delete(userId);
              return updated;
            });
            typingTimeouts.current.delete(userId);
          }, 3000);

          typingTimeouts.current.set(userId, timeout);
        } else {
          next.delete(userId);
          const timeout = typingTimeouts.current.get(userId);
          if (timeout) {
            clearTimeout(timeout);
            typingTimeouts.current.delete(userId);
          }
        }

        return next;
      });
    };

    const unsubscribe = presenceService.subscribeToTyping(matchId, handleTypingChange);

    return () => {
      unsubscribe();
      // Clear all timeouts
      typingTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeouts.current.clear();
    };
  }, [matchId]);

  // Send typing indicator (debounced)
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!matchId) return;

      const now = Date.now();

      // Throttle typing events to once per second
      if (isTyping && now - lastTypingSent.current < 1000) {
        return;
      }

      lastTypingSent.current = now;
      presenceService.sendTypingIndicator(matchId, isTyping);
    },
    [matchId]
  );

  // Convenience method for when user starts typing
  const startTyping = useCallback(() => {
    sendTyping(true);
  }, [sendTyping]);

  // Convenience method for when user stops typing
  const stopTyping = useCallback(() => {
    sendTyping(false);
  }, [sendTyping]);

  return {
    typingUsers: Array.from(typingUsers),
    isAnyoneTyping: typingUsers.size > 0,
    startTyping,
    stopTyping,
    sendTyping,
  };
}

/**
 * Format last seen time
 */
export function formatLastSeen(lastSeen: Date | null): string {
  if (!lastSeen) return 'Offline';

  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return lastSeen.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
