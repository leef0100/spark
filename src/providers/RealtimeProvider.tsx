import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNotifications } from '../services/notifications';
import { usePresence } from '../services/presence';
import { useAuthStore } from '../stores/authStore';

interface RealtimeContextValue {
  isNotificationsEnabled: boolean;
  expoPushToken: string | null;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  isNotificationsEnabled: false,
  expoPushToken: null,
});

export function useRealtimeContext() {
  return useContext(RealtimeContext);
}

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Initialize notifications
  const { isNotificationsEnabled, expoPushToken } = useNotifications();

  // Initialize presence tracking
  usePresence();

  const value = {
    isNotificationsEnabled,
    expoPushToken,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}
